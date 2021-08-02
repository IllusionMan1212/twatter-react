package routes

import (
	"illusionman1212/twatter-go/utils"
	"net/http"
)

func StartConversation(w http.ResponseWriter, req *http.Request) {

}

func GetConversations(w http.ResponseWriter, req *http.Request) {

}

func GetMessages(w http.ResponseWriter, req *http.Request) {

}

func GetUnreadMessages(w http.ResponseWriter, req *http.Request) {
	// TODO: get session and user id from cookie
	// TODO: fetch from the db

	utils.OkWithJSON(w, `{
		"message": "Fetched unread messages succesfully",
		"status": 200,
		"success": true,
		"unreadMessages": 0
	}`)
}
