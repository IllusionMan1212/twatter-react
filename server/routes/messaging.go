package routes

import "github.com/gorilla/mux"

func RegisterMessagingRoutes(router *mux.Router) {
	messagingRouter := router.PathPrefix("/messaging").Subrouter()

	messagingRouter.HandleFunc("/startConversation", StartConversation).Methods("POST")
	messagingRouter.HandleFunc("/deleteMessage", DeleteMessage).Methods("POST")

	messagingRouter.HandleFunc("/getConversations/{page}", GetConversations).Methods("GET")
	messagingRouter.HandleFunc("/getMessages/{conversationId}/{page}", GetMessages).Methods("GET")
	messagingRouter.HandleFunc("/getUnreadMessages", GetUnreadMessages).Methods("GET")
}
