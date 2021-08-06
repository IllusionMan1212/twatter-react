package models

import "database/sql"

type SocketPost struct {
	Content       string       `json:"content"`
	ContentLength int          `json:"contentLength"`
	Author        User         `json:"author"`
	Attachments   []Attachment `json:"attachments"`
}

type DBPost struct {
	ID         uint64       `json:"id"`
	Author     User         `json:"author"`
	Content    string       `json:"content"`
	CreatedAt  sql.NullTime `json:"created_at"`
	ReplyingTo ParentPost   `json:"replying_to"`
	Likes      int          `json:"likes"`
	Comments   int          `json:"comments"`
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

type Attachment struct {
	Url  string `json:"url"`
	Type string `json:"type"`
}
