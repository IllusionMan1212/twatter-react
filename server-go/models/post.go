package models

import "database/sql"

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
	ReplyingTo    uint64             `json:"replying_to"`
}

type DBPost struct {
	ID          uint64       `json:"id"`
	Author      User         `json:"author"`
	Content     string       `json:"content"`
	CreatedAt   sql.NullTime `json:"created_at"`
	ReplyingTo  ParentPost   `json:"replying_to"`
	Attachments []Attachment `json:"attachments"`
	Likes       int          `json:"likes"`
	Comments    int          `json:"comments"`
	Liked       bool         `json:"liked"`
}

// TODO: no idea if this is a good idea, seems to work for now ??
type ParentPost struct {
	ID         sql.NullInt64  `json:"id"`
	Author     ParentUser     `json:"author"`
	Content    sql.NullString `json:"content"`
	CreatedAt  sql.NullTime   `json:"created_at"`
	ReplyingTo *ParentPost    `json:"replying_to"`
	Likes      sql.NullInt32  `json:"likes"`
	Comments   sql.NullInt32  `json:"comments"`
}

type DeletePostBody struct {
	PostAuthorId uint64 `json:"postAuthorId"`
	PostId       uint64 `json:"postId"`
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
	PostId   uint64   `json:"postId"`
	LikeType LikeType `json:"likeType"`
}
