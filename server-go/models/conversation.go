package models

import (
	"database/sql"
)

type ConversationInitPayload struct {
	ReceiverId uint64 `json:"receiverId"`
	SenderId   uint64 `json:"senderId"`
}

type Conversation struct {
	ID             string       `json:"id"`
	LastUpdated    sql.NullTime `json:"last_updated"`
	Receiver       User         `json:"receiver"`
	LastMessage    string       `json:"last_message"`
	UnreadMessages int          `json:"unread_messages"`
}
