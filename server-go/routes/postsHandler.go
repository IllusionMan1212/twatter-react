package routes

import (
	"fmt"
	"illusionman1212/twatter-go/utils"
	"net/http"

	"github.com/gorilla/mux"
)

func DeletePost(w http.ResponseWriter, req *http.Request) {

}

func LikePost(w http.ResponseWriter, req *http.Request) {

}

func GetPostsCount(w http.ResponseWriter, req *http.Request) {
	utils.OkWithJSON(w, `{
		"message": "Successfully fetched posts count",
		"status": "200",
		"success": true,
		"count": 0
	}`)
}

func GetPosts(w http.ResponseWriter, req *http.Request) {
	// TODO: fetch posts from the db
	params := mux.Vars(req)

	page := params["page"]
	userId := params["userId"]

	fmt.Printf("page %v\n", page)
	fmt.Printf("userid %v\n", userId)

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
