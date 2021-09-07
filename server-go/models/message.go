package models

import (
	"time"

	"github.com/jackc/pgtype"
)

type Message struct {
	ID             uint64           `json:"id"`
	AuthorID       uint64           `json:"author_id"`
	ConversationID uint64           `json:"conversation_id"`
	Content        string           `json:"content"`
	SentTime       time.Time        `json:"sent_time"`
	ReadBy         pgtype.Int8Array `json:"read_by"`
	Deleted        bool             `json:"deleted"`
}

type SocketMessage struct {
	Content        string     `json:"message_content"`
	Attachment     Attachment `json:"attachments"`
	SenderId       uint64     `json:"sender_id"`
	ReceiverId     uint64     `json:"receiver_id"`
	ConversationId string     `json:"conversation_id"`
}
