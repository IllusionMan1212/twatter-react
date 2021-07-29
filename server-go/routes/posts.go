package routes

import "github.com/gorilla/mux"

func RegisterPostsRoutes(router *mux.Router) {
	postRouter := router.PathPrefix("/posts").Subrouter()

	postRouter.HandleFunc("/deletePost", DeletePost).Methods("POST") // validations required
	postRouter.HandleFunc("/likePost", LikePost).Methods("POST")     // validations required

	postRouter.HandleFunc("/getPostsCount/{userId}", GetPostsCount).Methods("GET")     // no validation
	postRouter.HandleFunc("/getPosts/{page:[0-9]+}", GetPosts).Methods("GET")          // no validation
	postRouter.HandleFunc("/getPosts/{page:[0-9]+}/{userId}", GetPosts).Methods("GET") // no validation
	postRouter.HandleFunc("/getPost", GetPost).Methods("GET")                          // no validation
	postRouter.HandleFunc("/getComments/{postId}", GetComments).Methods("GET")         // no validation
}
