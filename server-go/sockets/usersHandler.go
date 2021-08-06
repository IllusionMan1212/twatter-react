package sockets

import (
	"context"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
)

func UpdateProfile(socketMessage *models.SocketMessage, client *Client) {
	// TODO: implement this
	client.send <- []byte("TODO")
}

func RemoveBirthday(socketMessage *models.SocketMessage, client *Client) {
	user := &models.User{}

	// NOTE: this looks disgusting
	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketMessage.Data)), user)

	db.DBPool.QueryRow(context.Background(), "UPDATE users SET birthday = null WHERE id = $1;", user.ID)

	payload := fmt.Sprintf(`{
		"eventType": "birthdayRemoved",
		"data": {
			"id": "%v"
		}
	}`, user.ID)

	client.send <- []byte(payload)
}
