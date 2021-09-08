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

	returnedAttachments, err := writeAttachmentsFiles(post.Attachments, postId, invokingClient)
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

	postPayload := fmt.Sprintf(`{
		"eventType": "post",
		"data": {
		  "id": "%v",
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
		client.emitEvent([]byte(postPayload))
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

	returnedAttachments, err := writeAttachmentsFiles(comment.Attachments, commentId, invokingClient)
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

	returnedComment.ReplyingTo.ID.Int64 = int64(comment.ReplyingTo)
	returnedComment.ReplyingTo.ID.Valid = true

	commentPayload := fmt.Sprintf(`{
		"eventType": "commentToClient",
		"data": {
		  "id": "%v",
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
		client.send <- []byte(commentPayload)
	}
}
