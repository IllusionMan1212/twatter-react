package models

import (
	"time"
)

type Message struct {
	ID             string     `json:"id"`
	AuthorID       string     `json:"author_id"`
	ConversationID string     `json:"conversation_id"`
	Content        string     `json:"content"`
	SentTime       time.Time  `json:"sent_time"`
	ReadBy         []string   `json:"read_by"`
	Attachment     Attachment `json:"attachment"`
	Deleted        bool       `json:"deleted"`
}

type SocketMessage struct {
	Content        string     `json:"message_content"`
	Attachment     Attachment `json:"attachments"`
	SenderId       string     `json:"sender_id"`
	ReceiverId     string     `json:"receiver_id"`
	ConversationId string     `json:"conversation_id"`
}

type DeleteMessageBody struct {
	MessageID string `json:"message_id"`
}

type DeleteMessageSocketPayload struct {
	MessageID  string `json:"message_id"`
	ReceiverID string `json:"receiver_id"`
}

type MessageReturnPayload struct {
	MessageID      string `json:"id"`
	Attachment     string `json:"attachment"`
	Content        string `json:"content"`
	ConversationID string `json:"conversation_id"`
	ReceiverID     string `json:"receiver_id"`
	AuthorID       string `json:"author_id"`
	SentTime       string `json:"sent_time"`
	Deleted        bool   `json:"deleted"`
}

type TypingData struct {
	ConversationID string `json:"conversationId"`
	ReceiverID     string `json:"receiverId"`
}

type TypingReturnPayload struct {
	ConversationID string `json:"conversationId"`
}
