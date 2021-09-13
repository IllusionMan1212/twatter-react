package routes

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"net/http"
	"sort"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4"
)

func StartConversation(w http.ResponseWriter, req *http.Request) {
	body := &models.ConversationInitPayload{}
	err := json.NewDecoder(req.Body).Decode(&body)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while decoding request body: ", err)
		return
	}

	sessionUser, err := utils.ValidateSession(req, w)
	if err != nil {
		logger.Error(err)
		return
	}

	if sessionUser.ID != fmt.Sprintf("%v", body.SenderId) {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Unauthorized user, please log in",
			"status": 401,
			"success": false
		}`)
		logger.Info("Mismatching cookie user id and senderId")
		return
	}

	if body.ReceiverId == body.SenderId {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": 400,
			"success": false
		}`)
		logger.Infof("Attempt to start conversation with self. ID: %v", body.ReceiverId)
		return
	}

	// checking if the conversation already exists (it exists if initiated by the other party but no messages were sent)
	checkQuery := `SELECT id, participants FROM conversations WHERE members = $1;`
	existingConvoId := uint64(0)
	existingParticipants := make([]uint64, 0)

	receiverId, err := strconv.Atoi(body.ReceiverId)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while converting string to int: %v", err)
		return
	}
	senderId, err := strconv.Atoi(body.SenderId)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while converting string to int: %v", err)
		return
	}

	membersToCheck := []uint64{uint64(receiverId), uint64(senderId)}

	// if the sorted members slice matches an existing sorted array in the DB then a conversation already exists. otherwise create a new one
	sort.Slice(membersToCheck, func(i, j int) bool { return membersToCheck[i] < membersToCheck[j] })

	err = db.DBPool.QueryRow(context.Background(), checkQuery, membersToCheck).Scan(&existingConvoId, &existingParticipants)
	if err != nil {
		if err != pgx.ErrNoRows {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error while fetching conversation: %v", err)
			return
		}
	}

	if existingConvoId != 0 {
		// check if the sender isn't in the participants and add them

		if !utils.Contains(existingParticipants, body.SenderId) {
			updateQuery := `UPDATE conversations SET participants = $1 WHERE id = $2`

			newParticipants := append(existingParticipants, uint64(senderId))

			sort.Slice(newParticipants, func(i, j int) bool { return newParticipants[i] < newParticipants[j] })

			_, err = db.DBPool.Exec(context.Background(), updateQuery, newParticipants, existingConvoId)
			if err != nil {
				utils.InternalServerErrorWithJSON(w, "")
				logger.Errorf("Error while updating existing conversation: %v", err)
				return
			}
		}

		utils.OkWithJSON(w, fmt.Sprintf(`{
			"message": "Conversation found",
			"status": 200,
			"success": true,
			"conversationId": "%v"
		}`, existingConvoId))
		return
	}

	convoId, err := db.Snowflake.NextID()
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while generating a new id: ", err)
		return
	}

	members := []uint64{uint64(receiverId), uint64(senderId)}
	participants := []uint64{uint64(senderId)}

	// always sort the members array so lookups in the DB are faster and we're able to easily compare
	sort.Slice(members, func(i, j int) bool { return members[i] < members[j] })

	insertQuery := `INSERT INTO conversations(id, members, participants)
		VALUES($1, $2, $3)`

	_, err = db.DBPool.Exec(context.Background(), insertQuery, convoId, members, participants)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while inserting a new conversation: %v", err)
		return
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Conversation created",
		"status": 200,
		"success": true,
		"conversationId": "%v"
	}`, convoId))
}

func DeleteMessage(w http.ResponseWriter, req *http.Request) {
	body := &models.DeleteMessageBody{}
	err := json.NewDecoder(req.Body).Decode(&body)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while decoding request body: %v", err)
		return
	}

	updateQuery := `UPDATE messages SET deleted = true, content = '' WHERE id = $1`

	_, err = db.DBPool.Exec(context.Background(), updateQuery, body.MessageID)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while updating message: %v", err)
		return
	}

	// TODO: remove attachments from filesystem and from DB

	utils.OkWithJSON(w, `{
		"message": "Deleted message successfully",
		"status": 200,
		"success": true
	}`)
}

func GetConversations(w http.ResponseWriter, req *http.Request) {
	params := mux.Vars(req)
	pageParam := params["page"]
	page, err := strconv.Atoi(pageParam)
	if err != nil {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": 400,
			"success": false
		}`)
		logger.Errorf("Error while converting page param to string: %v", err)
		return
	}

	sessionUser, err := utils.ValidateSession(req, w)
	if err != nil {
		logger.Error(err)
		return
	}

	query := `SELECT convo.id, convo.last_updated,
		receiver.id as receiver_id, receiver.username as receiver_username, receiver.display_name as receiver_display_name, receiver.avatar_url as receiver_avatar_url,
		(SELECT content
			FROM messages
			WHERE conversation_id = convo.id
			GROUP BY content
			ORDER BY MAX(sent_time) DESC
			LIMIT 1) as last_message,
		COUNT(messages) as unread_messages
		FROM conversations convo
		INNER JOIN users receiver
		ON receiver.id <> $1 AND receiver.id = ANY(convo.members)
		LEFT JOIN messages
		ON messages.conversation_id = convo.id AND $1 <> ANY(messages.read_by)
		WHERE $1 = ANY(convo.participants)
		GROUP BY convo.id, receiver.id
		ORDER BY convo.last_updated DESC
		LIMIT 20 OFFSET $2;`

	rows, err := db.DBPool.Query(context.Background(), query, sessionUser.ID, page*20)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while fetching conversations: %s", err)
		return
	}

	conversations := make([]models.Conversation, 0)

	defer rows.Close()
	for rows.Next() {
		conversation := &models.Conversation{}
		var conversationId uint64
		var receiverId uint64

		err := rows.Scan(&conversationId, &conversation.LastUpdated,
			&receiverId, &conversation.Receiver.Username, &conversation.Receiver.DisplayName, &conversation.Receiver.AvatarURL,
			&conversation.LastMessage,
			&conversation.UnreadMessages)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error scanning fields into conversation struct: %s", err)
			return
		}
		conversation.ID = fmt.Sprintf("%v", conversationId)
		conversation.Receiver.ID = fmt.Sprintf("%v", receiverId)

		// TODO: if lastmessage has attachment only and no content, show "sent an attachment" as lastmessage

		conversations = append(conversations, *conversation)
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Fetched conversations successfully",
		"status": 200,
		"success": true,
		"conversations": %v
	}`, utils.MarshalJSON(conversations)))
}

func GetMessages(w http.ResponseWriter, req *http.Request) {
	params := mux.Vars(req)
	conversationId := params["conversationId"]
	pageParam := params["page"]
	page, err := strconv.Atoi(pageParam)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while converting page string to int: %v", err)
		return
	}

	_, err = utils.ValidateSession(req, w)
	if err != nil {
		logger.Error(err)
		return
	}

	query := `SELECT message.id, message.author_id, message.conversation_id, message.content, message.sent_time, message.read_by, message.deleted,
		attachment.url, attachment.type
		FROM messages message
		LEFT JOIN message_attachments attachment
		ON attachment.message_id = message.id
		WHERE conversation_id = $1
		ORDER BY message.sent_time DESC
		LIMIT 50 OFFSET $2;`

	rows, err := db.DBPool.Query(context.Background(), query, conversationId, page*50)
	if err != nil {
		if err == pgx.ErrNoRows {
			utils.NotFoundWithJSON(w, `{
				"message": "No messages were found",
				"status": 404,
				"success": true
			}`)
			return
		}

		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while querying for messages: %v", err)
		return
	}

	messages := make([]models.Message, 0)

	for rows.Next() {
		message := &models.Message{}
		var messageId uint64
		var messageAuthorId uint64
		var messageConversationId uint64
		var readBy pgtype.Int8Array

		var attachmentUrl sql.NullString
		var attachmentType sql.NullString

		err = rows.Scan(&messageId, &messageAuthorId, &messageConversationId, &message.Content, &message.SentTime, &readBy, &message.Deleted,
			&attachmentUrl, &attachmentType)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, "")
			logger.Errorf("Error while scanning message data into struct: %v", err)
			return
		}

		if attachmentUrl.Valid && attachmentType.Valid {
			message.Attachment.Url = attachmentUrl.String
			message.Attachment.Type = attachmentType.String
		}

		message.ID = fmt.Sprintf("%v", messageId)
		message.AuthorID = fmt.Sprintf("%v", messageAuthorId)
		message.ConversationID = fmt.Sprintf("%v", messageConversationId)
		for _, element := range readBy.Elements {
			message.ReadBy = append(message.ReadBy, fmt.Sprintf("%v", element.Int))
		}

		messages = append(messages, *message)
	}

	// sort the latest messages by sent time in ascending order
	sort.Slice(messages, func(i, j int) bool { return messages[i].SentTime.Before(messages[j].SentTime) })

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Successfully fetched messages",
		"status": 200,
		"success": true,
		"messages": %v
	}`, utils.MarshalJSON(messages)))
}

func GetUnreadMessages(w http.ResponseWriter, req *http.Request) {
	sessionUser, err := utils.ValidateSession(req, w)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Error(err)
		return
	}

	query := `SELECT COUNT(*) AS unread_convos
		FROM (SELECT COUNT(*) FROM conversations convo
			INNER JOIN messages
			ON messages.conversation_id = convo.id
			WHERE $1 <> ANY(messages.read_by)
			AND $1 = ANY(convo.participants)
			GROUP BY convo.id
		) as convos`

	var unread_convos int

	err = db.DBPool.QueryRow(context.Background(), query, sessionUser.ID).Scan(&unread_convos)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, "")
		logger.Errorf("Error while querying for unread messages: %v", err)
		return
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Fetched unread messages succesfully",
		"status": 200,
		"success": true,
		"unreadMessages": %v
	}`, unread_convos))
}
