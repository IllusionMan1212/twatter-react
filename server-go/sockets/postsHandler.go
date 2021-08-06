package sockets

import (
	"context"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"time"

	"github.com/sony/sonyflake"
)

func Post(socketMessage *models.SocketMessage, client *Client) {
	post := &models.SocketPost{}

	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketMessage.Data)), post)

	snowflake := sonyflake.NewSonyflake(sonyflake.Settings{
		StartTime: time.Date(2021, time.January, 1, 0, 0, 0, 0, time.UTC),
	})
	id, err := snowflake.NextID()
	if err != nil {
		// TODO: return error somehow
		panic(err)
	}

	insertQuery := `INSERT INTO posts(id, content, user_id)
		VALUES($1, $2, $3)
		RETURNING id, content, created_at;`

	returnedPost := &models.DBPost{}

	// TODO: implement logic to determine if the post is a comment or a standable post
	err = db.DBPool.QueryRow(context.Background(), insertQuery, id, post.Content, post.Author.ID).Scan(&returnedPost.ID, &returnedPost.Content, &returnedPost.CreatedAt)
	if err != nil {
		// TODO: something
		panic(err)
	}

	dataToBeReturned := fmt.Sprintf(`{
		"eventType": "post",
		"data": {
		  "id": %v,
		  "content": "%v",
		  "author": %v,
		  "created_at": %v,
		  "attachments": [],
		  "likes": %v,
		  "comments": 0,
		  "replying_to": %v
		}
	}`,
		returnedPost.ID,
		returnedPost.Content,
		utils.MarshalJSON(post.Author),
		utils.MarshalJSON(returnedPost.CreatedAt),
		returnedPost.Likes,
		utils.MarshalJSON(returnedPost.ReplyingTo))

	client.send <- []byte(dataToBeReturned)
}
