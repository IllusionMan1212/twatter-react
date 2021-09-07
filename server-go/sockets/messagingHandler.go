package sockets

import (
	"context"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"strconv"
)

func Message(socketPayload *models.SocketPayload, clients []*Client, invokingClient *Client) {
	message := &models.SocketMessage{}

	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketPayload.Data)), message)

	logger.Debugf("%v", message)

	// TODO: write the message to the db and then send it back to all connected client sockets
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

	_, err = db.DBPool.Exec(context.Background(), insertQuery, messageId, message.SenderId, conversationId, message.Content, []uint64{message.SenderId})
	if err != nil {
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while inserting new message into database: %v", err)
		return
	}
}
