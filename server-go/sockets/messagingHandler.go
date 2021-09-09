package sockets

import (
	"context"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"strconv"
	"time"
)

func Message(socketPayload *models.SocketPayload, clients []*Client, invokingClient *Client) {
	message := &models.SocketMessage{}

	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketPayload.Data)), message)

	// TODO: write attachment if exists

	insertQuery := `INSERT INTO messages(id, author_id, conversation_id, content, read_by)
		VALUES($1, $2, $3, $4, $5)`

	// TODO: check length of content ??? encrypted content would probably vary and even exceed the 1000 character limit. so maybe dont check

	conversationId, err := strconv.Atoi(message.ConversationId)
	if err != nil {
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while parsing conversation id: %v", err)
		return
	}

	messageId, err := db.Snowflake.NextID()
	if err != nil {
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while generating id for new message: %v", err)
		return
	}

	senderId, err := strconv.Atoi(message.SenderId)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `
			"message": "An error has occurred, please try again",
			"status": 500,
			"success": false
		`)
		logger.Errorf("Error while converting string to int: %v", err)
		return
	}_

	_, err = db.DBPool.Exec(context.Background(), insertQuery, messageId, message.SenderId, conversationId, message.Content, []uint64{uint64(senderId)})
	if err != nil {
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while inserting new message into database: %v", err)
		return
	}

	updateQuery := `UPDATE conversations SET last_updated = now() at time zone 'utc' WHERE id = $1`

	_, err = db.DBPool.Exec(context.Background(), updateQuery, conversationId)
	if err != nil {
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while updating conversation's last_updated field: %v", err)
		return
	}

	messagePayload := fmt.Sprintf(`{
		"eventType": "message",
		"data": {
			"attachment": "%v",
      "content": "%v",
      "conversation_id": "%v",
      "receiver_id": "%v",
      "author_id": "%v",
      "sent_time": "%v",
			"deleted": false
		}
	}`,
		message.Attachment.Url,
		message.Content,
		message.ConversationId,
		message.ReceiverId,
		message.SenderId,
		time.Now().UTC().Format(time.RFC3339))

	for _, receiverClient := range invokingClient.hub.users[fmt.Sprintf("%v", message.ReceiverId)] {
		receiverClient.emitEvent([]byte(messagePayload))
	}

	for _, client := range clients {
		client.emitEvent([]byte(messagePayload))
	}
}
