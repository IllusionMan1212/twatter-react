package models

import (
	"database/sql"
	"time"
)

type SocketPost struct {
	Content       string             `json:"content"`
	ContentLength int                `json:"contentLength"`
	Author        User               `json:"author"`
	Attachments   []SocketAttachment `json:"attachments"`
}

type SocketComment struct {
	Content       string             `json:"content"`
	ContentLength int                `json:"contentLength"`
	Author        User               `json:"author"`
	Attachments   []SocketAttachment `json:"attachments"`
	ReplyingTo    string             `json:"replying_to"`
}

type DBPost struct {
	ID          string       `json:"id"`
	Author      User         `json:"author"`
	Content     string       `json:"content"`
	CreatedAt   time.Time    `json:"created_at"`
	ReplyingTo  ParentPost   `json:"replying_to"`
	Attachments []Attachment `json:"attachments"`
	Likes       int          `json:"likes"`
	Comments    int          `json:"comments"`
	Liked       bool         `json:"liked"`
}

type ParentPost struct {
	ID         sql.NullString `json:"id"`
	Author     ParentUser     `json:"author"`
	Content    sql.NullString `json:"content"`
	CreatedAt  sql.NullTime   `json:"created_at"`
	ReplyingTo *ParentPost    `json:"replying_to"`
	Likes      sql.NullInt32  `json:"likes"`
	Comments   sql.NullInt32  `json:"comments"`
}

type DeletePostBody struct {
	PostAuthorId string `json:"postAuthorId"`
	PostId       string `json:"postId"`
}

type LikeType string

func (n LikeType) String() string {
	switch n {
	case "LIKE":
	case "UNLIKE":
	default:
		return "Error: Wrong type"
	}
	return string(n)
}

type LikePostBody struct {
	PostId   string   `json:"postId"`
	LikeType LikeType `json:"likeType"`
}

type PostReturnPayload struct {
	ID          string       `json:"id"`
	Content     string       `json:"content"`
	Author      User         `json:"author"`
	CreatedAt   time.Time    `json:"created_at"`
	Attachments []Attachment `json:"attachments"`
	Likes       int          `json:"likes"`
	Comments    int          `json:"comments"`
	ReplyingTo  ParentPost   `json:"replying_to"`
}
