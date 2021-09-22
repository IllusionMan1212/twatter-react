package main

import "github.com/gorilla/mux"

func RegisterCdnRoutes(router *mux.Router) {
	router.HandleFunc("/profile_images/{userId}/{fileName}", GetProfileImage).Methods("GET")
	router.HandleFunc("/posts/{postId}/{fileName}", GetPostImages).Methods("GET")
	router.HandleFunc("/messages/{conversationId}/{messageId}/{fileName}", GetMessageImage).Methods("GET")
}
