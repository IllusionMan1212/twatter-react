package sockets

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"os"
	"strings"

	"github.com/go-oss/image/imageutil"
)

func Post(socketMessage *models.SocketMessage, clients []*Client) {
	post := &models.SocketPost{}

	// NOTE: this is still ugly af
	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketMessage.Data)), post)

	if len(post.Attachments) == 0 && post.Content == "" {
		// TODO: throw proper error and return it thru socket
		panic("can't send empty post")
	}

	postId, err := db.Snowflake.NextID()
	if err != nil {
		// TODO: return error somehow
		panic(err)
	}

	insertQuery := `INSERT INTO posts(id, content, user_id)
		VALUES($1, $2, $3)
		RETURNING created_at;`

	returnedPost := &models.DBPost{}
	returnedAttachments := make([]models.Attachment, 0)

	err = db.DBPool.QueryRow(context.Background(), insertQuery, postId, post.Content, post.Author.ID).Scan(&returnedPost.CreatedAt)
	if err != nil {
		// TODO: something
		panic(err)
	}

	// write the attachments to files
	for i, attachment := range post.Attachments {
		buf, err := base64.StdEncoding.DecodeString(attachment.Data)
		if err != nil {
			panic(err)
		}

		var imageBytes []byte
		mimetype := attachment.Mimetype

		imageBytes = buf

		mimetypeSlice := strings.Split(mimetype, "/")
		attachmentMimetype := mimetypeSlice[0]
		extension := mimetypeSlice[1]

		var attachmentType string

		if attachmentMimetype == "image" {
			if extension == "gif" {
				attachmentType = models.Gif
			} else {
				attachmentType = models.Image
			}
		} else if attachmentMimetype == "video" {
			attachmentType = models.Video
		}

		if mimetype == "image/jpg" || mimetype == "image/jpeg" {
			r := bytes.NewReader(buf)
			reader, err := imageutil.RemoveExif(r)
			if err != nil {
				panic(err)
			}
			tempBuf := new(bytes.Buffer)
			tempBuf.ReadFrom(reader)
			imageBytes = tempBuf.Bytes()
		}

		fileDirectory := fmt.Sprintf("../cdn/posts/%v/", postId)
		if i == 0 {
			err = os.Mkdir(fileDirectory, 0755)
			if err != nil {
				// TODO: return error here somehow
				panic(err)
			}
		}

		filePath := fmt.Sprintf("%s/%v.%s", fileDirectory, i+1, extension)

		file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0644)
		if err != nil {
			// TODO: return error here somehow
			panic(err)
		}

		insertQuery := `INSERT INTO attachments(post_id, url, type, size)
		VALUES($1, $2, $3, $4)`

		attachmentUrl := fmt.Sprintf("%s/cdn/posts/%v/%v.%s",
			os.Getenv("API_DOMAIN_URL"),
			postId,
			i+1,
			extension)

		_, err = db.DBPool.Exec(context.Background(), insertQuery, postId, attachmentUrl, attachmentType, models.Large)
		if err != nil {
			// TODO: return error
			panic(err)
		}

		returnedAttachment := &models.Attachment{}
		returnedAttachment.Type = attachmentType
		returnedAttachment.Url = attachmentUrl

		returnedAttachments = append(returnedAttachments, *returnedAttachment)
		file.Write(imageBytes)
	}

	dataToBeReturned := fmt.Sprintf(`{
		"eventType": "post",
		"data": {
		  "id": %v,
		  "content": "%v",
		  "author": %v,
		  "created_at": %v,
		  "attachments": %v,
		  "likes": 0,
		  "comments": 0,
		  "replying_to": %v
		}
	}`,
		postId,
		post.Content,
		utils.MarshalJSON(post.Author),
		utils.MarshalJSON(returnedPost.CreatedAt),
		utils.MarshalJSON(returnedAttachments),
		utils.MarshalJSON(returnedPost.ReplyingTo))

	for _, client := range clients {
		client.send <- []byte(dataToBeReturned)
	}
}

func Comment(socketMessage *models.SocketMessage, clients []*Client) {
	comment := &models.SocketComment{}
	returnedAttachments := make([]models.Attachment, 0)

	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketMessage.Data)), comment)

	insertQuery := `INSERT INTO posts (id, content, user_id, parent_id)
	VALUES($1, $2, $3, $4)
	RETURNING created_at;`

	commentId, err := db.Snowflake.NextID()
	if err != nil {
		// TODO: return 500
		panic(err)
	}

	returnedComment := &models.DBPost{}

	err = db.DBPool.QueryRow(context.Background(), insertQuery, commentId, comment.Content, comment.Author.ID, comment.ReplyingTo).Scan(&returnedComment.CreatedAt)
	if err != nil {
		// TODO: return 500
		panic(err)
	}

	// write the attachments to files
	for i, attachment := range comment.Attachments {
		buf, err := base64.StdEncoding.DecodeString(attachment.Data)
		if err != nil {
			panic(err)
		}

		var imageBytes []byte
		mimetype := attachment.Mimetype

		imageBytes = buf

		mimetypeSlice := strings.Split(mimetype, "/")
		attachmentMimetype := mimetypeSlice[0]
		extension := mimetypeSlice[1]

		var attachmentType string

		if attachmentMimetype == "image" {
			if extension == "gif" {
				attachmentType = models.Gif
			} else {
				attachmentType = models.Image
			}
		} else if attachmentMimetype == "video" {
			attachmentType = models.Video
		}

		if mimetype == "image/jpg" || mimetype == "image/jpeg" {
			r := bytes.NewReader(buf)
			reader, err := imageutil.RemoveExif(r)
			if err != nil {
				panic(err)
			}
			tempBuf := new(bytes.Buffer)
			tempBuf.ReadFrom(reader)
			imageBytes = tempBuf.Bytes()
		}

		fileDirectory := fmt.Sprintf("../cdn/posts/%v/", commentId)
		if i == 0 {
			err = os.Mkdir(fileDirectory, 0755)
			if err != nil {
				// TODO: return error here somehow
				panic(err)
			}
		}

		filePath := fmt.Sprintf("%s/%v.%s", fileDirectory, i+1, extension)

		file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0644)
		if err != nil {
			// TODO: return error here somehow
			panic(err)
		}

		insertQuery := `INSERT INTO attachments(post_id, url, type, size)
		VALUES($1, $2, $3, $4)`

		attachmentUrl := fmt.Sprintf("%s/cdn/posts/%v/%v.%s",
			os.Getenv("API_DOMAIN_URL"),
			commentId,
			i+1,
			extension)

		_, err = db.DBPool.Exec(context.Background(), insertQuery, commentId, attachmentUrl, attachmentType, models.Large)
		if err != nil {
			// TODO: return error
			panic(err)
		}

		returnedAttachment := &models.Attachment{}
		returnedAttachment.Type = attachmentType
		returnedAttachment.Url = attachmentUrl

		returnedAttachments = append(returnedAttachments, *returnedAttachment)
		file.Write(imageBytes)
	}

	returnedComment.ReplyingTo.ID.Int64 = int64(comment.ReplyingTo)
	returnedComment.ReplyingTo.ID.Valid = true

	dataToBeReturned := fmt.Sprintf(`{
		"eventType": "commentToClient",
		"data": {
		  "id": %v,
		  "content": "%v",
		  "author": %v,
		  "created_at": %v,
		  "attachments": %v,
		  "likes": 0,
		  "comments": 0,
		  "replying_to": %v
		}
	}`,
		commentId,
		comment.Content,
		utils.MarshalJSON(comment.Author),
		utils.MarshalJSON(returnedComment.CreatedAt),
		utils.MarshalJSON(returnedAttachments),
		utils.MarshalJSON(returnedComment.ReplyingTo))

	for _, client := range clients {
		client.send <- []byte(dataToBeReturned)
	}
}
