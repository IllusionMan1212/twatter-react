package models

import (
	"time"
)

type ConversationInitPayload struct {
	ReceiverId uint64 `json:"receiverId"`
	SenderId   uint64 `json:"senderId"`
}

type Conversation struct {
	ID             uint64    `json:"id"`
	LastUpdated    time.Time `json:"last_updated"`
	Receiver       User      `json:"receiver"`
	LastMessage    string    `json:"last_message"`
	UnreadMessages int       `json:"unread_messages"`
}

type ReturnedConversation struct {
	ID             string    `json:"id"`
	LastUpdated    time.Time `json:"last_updated"`
	Receiver       User      `json:"receiver"`
	LastMessage    string    `json:"last_message"`
	UnreadMessages int       `json:"unread_messages"`
}
