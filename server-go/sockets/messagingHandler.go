package sockets

import (
	"context"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"sort"
	"strconv"
	"time"
)

func Message(socketPayload *models.SocketPayload, clients []*Client, invokingClient *Client) {
	message := &models.SocketMessage{}

	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketPayload.Data)), message)

	// TODO: write attachment if exists

	insertQuery := `INSERT INTO messages(id, author_id, conversation_id, content, read_by)
		VALUES($1, $2, $3, $4, $5)`

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
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while converting string to int: %v", err)
		return
	}

	receiverId, err := strconv.Atoi(message.ReceiverId)
	if err != nil {
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while converting string to int: %v", err)
		return
	}

	_, err = db.DBPool.Exec(context.Background(), insertQuery, messageId, message.SenderId, conversationId, message.Content, []uint64{uint64(senderId)})
	if err != nil {
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while inserting new message into database: %v", err)
		return
	}

	updateQuery := `UPDATE conversations SET last_updated = now() at time zone 'utc', participants = $1 WHERE id = $2`

	participants := []uint64{uint64(senderId), uint64(receiverId)}

	sort.Slice(participants, func(i, j int) bool { return participants[i] < participants[j] })

	_, err = db.DBPool.Exec(context.Background(), updateQuery, participants, conversationId)
	if err != nil {
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while updating conversation's last_updated field: %v", err)
		return
	}

	messagePayload := &models.MessageReturnPayload{}
	payload := &models.SocketPayload{}

	messagePayload.MessageID = fmt.Sprintf("%v", messageId)
	messagePayload.Attachment = message.Attachment.Url
	messagePayload.Content = message.Content
	messagePayload.ConversationID = message.ConversationId
	messagePayload.ReceiverID = message.ReceiverId
	messagePayload.AuthorID = message.SenderId
	messagePayload.SentTime = time.Now().UTC().Format(time.RFC3339)
	messagePayload.Deleted = false

	payload.EventType = "message"
	payload.Data = messagePayload

	for _, receiverClient := range invokingClient.hub.users[fmt.Sprintf("%v", message.ReceiverId)] {
		receiverClient.emitEvent([]byte(utils.MarshalJSON(payload)))
	}

	for _, client := range clients {
		client.emitEvent([]byte(utils.MarshalJSON(payload)))
	}
}

func DeleteMessage(socketPayload *models.SocketPayload, clients []*Client, invokingClient *Client, message []byte) {
	payload := &models.DeleteMessageSocketPayload{}

	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketPayload.Data)), payload)

	for _, client := range clients {
		client.emitEvent(message)
	}

	for _, client := range invokingClient.hub.users[payload.ReceiverID] {
		client.emitEvent(message)
	}
}

func Typing(socketPayload *models.SocketPayload, invokingClient *Client, eventType string) {
	data := &models.TypingData{}

	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketPayload.Data)), data)

	payload := &models.SocketPayload{}
	typingData := &models.TypingReturnPayload{}

	typingData.ConversationID = data.ConversationID

	payload.EventType = eventType
	payload.Data = typingData

	for _, receiverClient := range invokingClient.hub.users[data.ReceiverID] {
		receiverClient.emitEvent([]byte(utils.MarshalJSON(payload)))
	}
}
