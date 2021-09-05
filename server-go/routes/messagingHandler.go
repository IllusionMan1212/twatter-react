package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/redissession"
	"illusionman1212/twatter-go/utils"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v4"
)

func StartConversation(w http.ResponseWriter, req *http.Request) {
	body := &models.ConversationInitPayload{}
	err := json.NewDecoder(req.Body).Decode(&body)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		logger.Errorf("Error while decoding request body: ", err)
		return
	}

	session := redissession.GetSession(req)

	if session.IsNew {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Unauthorized user, please log in",
			"status": 401,
			"success": false
		}`)
		logger.Info("Unauthorized user attempted to fetch conversations")
		return
	}

	sessionUser, ok := session.Values["user"].(*models.User)
	if !ok {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		logger.Error("Error while extracting user info from session")
		return
	}

	if sessionUser.ID != body.SenderId {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Unauthorized user, please log in",
			"status": 401,
			"success": false
		}`)
		logger.Info("Mismatching cookie user and senderId")
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

	// checking if the conversation already exists (initiated by the other party but no messages were sent)
	checkQuery := `SELECT id, participants FROM conversations WHERE ARRAY[$1::int8, $2::int8] = members;`
	existingConvoId := uint64(0)
	existingParticipants := make([]uint64, 0)

	err = db.DBPool.QueryRow(context.Background(), checkQuery, body.ReceiverId, body.SenderId).Scan(&existingConvoId, &existingParticipants)
	if err != nil {
		if err != pgx.ErrNoRows {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again",
				"status": 500,
				"success": false
			}`)
			logger.Errorf("Error while fetching conversation: %v", err)
			return
		}
	}

	if existingConvoId != 0 {
		// TODO: check if the sender isn't in the participants and add them

		utils.OkWithJSON(w, fmt.Sprintf(`{
			"message": "Conversation found",
			"status": 200,
			"success": true,
			"conversationId": %v
		}`, existingConvoId))
		return
	}

	convoId, err := db.Snowflake.NextID()
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		logger.Errorf("Error while generating a new id: ", err)
		return
	}

	members := []uint64{body.ReceiverId, body.SenderId}
	participants := []uint64{body.SenderId}

	insertQuery := `INSERT INTO conversations(id, members, participants)
		VALUES($1, $2, $3)`

	_, err = db.DBPool.Exec(context.Background(), insertQuery, convoId, members, participants)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		logger.Error("Error while inserting a new convo")
		return
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Conversation created",
		"status": 200,
		"success": true,
		"conversationId": %v
	}`, convoId))
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

	session := redissession.GetSession(req)

	if session.IsNew {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Unauthorized user, please log in",
			"status": 401,
			"success": false
		}`)
		logger.Info("Unauthorized user attempted to fetch conversations")
		return
	}

	sessionUser, ok := session.Values["user"].(*models.User)
	if !ok {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		logger.Error("Error while extracting user info from session")
		return
	}

	// TODO: query for unread messages and last message
	query := `SELECT convo.id, convo.last_updated,
		receiver.id as receiver_id, receiver.username as receiver_username, receiver.display_name as receiver_display_name, receiver.avatar_url as receiver_avatar_url
		FROM conversations convo
		INNER JOIN users receiver
		ON receiver.id <> $1 AND receiver.id = ANY(convo.members)
		WHERE $1 = ANY(convo.participants)
		ORDER BY convo.last_updated DESC
		LIMIT 20 OFFSET $2;`

	rows, err := db.DBPool.Query(context.Background(), query, sessionUser.ID, page*20)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		logger.Errorf("Error while fetching conversations: %s", err)
		return
	}

	conversations := make([]models.Conversation, 0)

	defer rows.Close()
	for rows.Next() {
		conversation := &models.Conversation{}

		err := rows.Scan(&conversation.ID, &conversation.LastUpdated,
			&conversation.Receiver.ID, &conversation.Receiver.Username, &conversation.Receiver.DisplayName, &conversation.Receiver.AvatarURL)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": 500,
				"success": false
			}`)
			logger.Errorf("Error scanning fields into conversation struct: %s", err)
			return
		}

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
	// TODO: implement

	utils.OkWithJSON(w, `{
		"message": "Successfully fetched messages",
		"status": 200,
		"success": true,
		"messages": []
	}`)
}

func GetUnreadMessages(w http.ResponseWriter, req *http.Request) {
	// TODO: get session and user id from cookie
	// TODO: fetch from the db

	utils.OkWithJSON(w, `{
		"message": "Fetched unread messages succesfully",
		"status": 200,
		"success": true,
		"unreadMessages": 0
	}`)
}
