package routes

import (
	"illusionman1212/twatter-go/utils"
	"net/http"
)

func DeletePost(w http.ResponseWriter, req *http.Request) {

}

func LikePost(w http.ResponseWriter, req *http.Request) {

}

func GetPosts(w http.ResponseWriter, req *http.Request) {
	// TODO: fetch posts from the db

	utils.OkWithJSON(w, `{
		"message": "Successfully fetched posts",
		"status": "200",
		"success": true,
		"posts": []
	}`)
}

func GetPost(w http.ResponseWriter, req *http.Request) {

}

func GetComments(w http.ResponseWriter, req *http.Request) {

}
