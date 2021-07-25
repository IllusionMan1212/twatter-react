package routes

import "github.com/gorilla/mux"

func RegisterPostsRoutes(router *mux.Router) {
	postRouter := router.PathPrefix("/posts").Subrouter()

	postRouter.HandleFunc("/deletePost", DeletePost).Methods("POST") // validations required
	postRouter.HandleFunc("/likePost", LikePost).Methods("POST")     // validations required

	postRouter.HandleFunc("/getPosts/{userId}", GetPosts).Methods("GET")       // no validation
	postRouter.HandleFunc("/getPost", GetPost).Methods("GET")                  // no validation
	postRouter.HandleFunc("/getComments/{postId}", GetComments).Methods("GET") // no validation
}
