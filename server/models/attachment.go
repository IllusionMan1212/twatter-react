package models

import (
	"github.com/jackc/pgtype"
)

type Attachment struct {
	Url  string `json:"url"`
	Type string `json:"type"`
}

type DBAttachment struct {
	Urls  pgtype.VarcharArray `json:"url"`
	Types pgtype.VarcharArray `json:"type"`
}

type SocketAttachment struct {
	Mimetype string `json:"mimetype"`
	Data     string `json:"data"`
}

const (
	Large     = "large"
	Medium    = "medium"
	Small     = "small"
	Thumbnail = "thumbnail"
)

var SupportedAttachmentTypes = map[string]bool{"image": true, "gif": true, "video": true}
