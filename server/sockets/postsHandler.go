package sockets

import (
	"context"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
)

func Post(socketPayload *models.SocketPayload, clients []*Client, invokingClient *Client) {
	post := &models.SocketPost{}

	// NOTE: this is still ugly af
	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketPayload.Data)), post)

	if len(post.Attachments) == 0 && post.Content == "" {
		errPayload := `{
			"eventType": "postError",
			"data": {
				"message": "Cannot send an empty post"
			}
		}`
		invokingClient.emitEvent([]byte(errPayload))
		logger.Error("Cannot send an empty post")
		return
	}

	postId, err := db.Snowflake.NextID()
	if err != nil {
		errPayload := `{
			"eventType": "postError",
			"data": {
				"message": "An error has occurred, please try again later"
			}
		}`
		invokingClient.emitEvent([]byte(errPayload))
		logger.Errorf("Error while generating id for new post: %v", err)
		return
	}

	insertQuery := `INSERT INTO posts(id, content, user_id)
		VALUES($1, $2, $3)
		RETURNING created_at;`

	returnedPost := &models.DBPost{}

	err = db.DBPool.QueryRow(context.Background(), insertQuery, postId, post.Content, post.Author.ID).Scan(&returnedPost.CreatedAt)
	if err != nil {
		errPayload := `{
			"eventType": "postError",
			"data": {
				"message": "An error has occurred, please try again later"
			}
		}`
		invokingClient.emitEvent([]byte(errPayload))
		logger.Errorf("Error while inserting into posts table: %v", err)
		return
	}

	returnedAttachments, err := writePostAttachmentsFiles(post.Attachments, postId)
	if err != nil {
		errPayload := fmt.Sprintf(`{
			"eventType": "postError",
			"data": {
				"message": "%v"
			}
		}`, err)
		invokingClient.emitEvent([]byte(errPayload))
		return
	}

	payload := &models.SocketPayload{}
	dataPayload := &models.PostReturnPayload{}

	dataPayload.ID = fmt.Sprintf("%v", postId)
	dataPayload.Content = post.Content
	dataPayload.Author = post.Author
	dataPayload.CreatedAt = returnedPost.CreatedAt
	dataPayload.Attachments = returnedAttachments
	dataPayload.Likes = 0
	dataPayload.Comments = 0
	dataPayload.ReplyingTo = returnedPost.ReplyingTo

	payload.EventType = "post"
	payload.Data = dataPayload

	for _, client := range clients {
		client.emitEvent([]byte(utils.MarshalJSON(payload)))
	}
}

func Comment(socketPayload *models.SocketPayload, clients []*Client, invokingClient *Client) {
	comment := &models.SocketComment{}

	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketPayload.Data)), comment)

	if len(comment.Attachments) == 0 && comment.Content == "" {
		errPayload := `{
			"eventType": "postError",
			"data": {
				"message": "Cannot send an empty post"
			}
		}
		`
		invokingClient.emitEvent([]byte(errPayload))
		logger.Error("Cannot send an empty post")
		return
	}

	insertQuery := `INSERT INTO posts (id, content, user_id, parent_id)
	VALUES($1, $2, $3, $4)
	RETURNING created_at;`

	commentId, err := db.Snowflake.NextID()
	if err != nil {
		errPayload := `{
			"eventType": "postError",
			"data": {
				"message": "An error has occurred, please try again later"
			}
		}
		`
		invokingClient.emitEvent([]byte(errPayload))
		logger.Errorf("Error while generating id for new post: %v", err)
		return
	}

	returnedComment := &models.DBPost{}

	err = db.DBPool.QueryRow(context.Background(), insertQuery, commentId, comment.Content, comment.Author.ID, comment.ReplyingTo).Scan(&returnedComment.CreatedAt)
	if err != nil {
		errPayload := `{
			"eventType": "postError",
			"data": {
				"message": "An error has occurred, please try again later"
			}
		}
		`
		invokingClient.emitEvent([]byte(errPayload))
		logger.Errorf("Error while inserting into posts table: %v", err)
		return
	}

	returnedAttachments, err := writePostAttachmentsFiles(comment.Attachments, commentId)
	if err != nil {
		errPayload := `{
			"eventType": "postError",
			"data": {
				"message": "An error has occurred, please try again later"
			}
		}
		`
		invokingClient.emitEvent([]byte(errPayload))
		return
	}

	returnedComment.ReplyingTo.ID.String = comment.ReplyingTo
	returnedComment.ReplyingTo.ID.Valid = true

	payload := &models.SocketPayload{}
	dataPayload := &models.PostReturnPayload{}

	dataPayload.ID = fmt.Sprintf("%v", commentId)
	dataPayload.Content = comment.Content
	dataPayload.Author = comment.Author
	dataPayload.CreatedAt = returnedComment.CreatedAt
	dataPayload.Attachments = returnedAttachments
	dataPayload.Likes = 0
	dataPayload.Comments = 0
	dataPayload.ReplyingTo = returnedComment.ReplyingTo

	payload.EventType = "commentToClient"
	payload.Data = dataPayload

	for _, client := range clients {
		client.emitEvent([]byte(utils.MarshalJSON(payload)))
	}
}
