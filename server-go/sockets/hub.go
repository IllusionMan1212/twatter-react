package sockets

import (
	"fmt"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered users and their clients.
	users map[string][]*Client

	// Inbound messages from the clients.
	broadcast chan UserMessagePayload

	// Register requests from the clients.
	register chan UserClientPayload

	// Unregister requests from clients.
	unregister chan UserClientPayload
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan UserMessagePayload),
		register:   make(chan UserClientPayload),
		unregister: make(chan UserClientPayload),
		users:      make(map[string][]*Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case payload := <-h.register:
			// append to the clients slice on the specific userID map item
			h.users[payload.UserID] = append(h.users[payload.UserID], payload.Client)
		case payload := <-h.unregister:
			// check if websocket exists in the slice in the specific userid map item
			if utils.Contains(h.users[payload.UserID], payload.Client) {
				h.users[payload.UserID] = removeClient(h.users[payload.UserID], payload.Client)
				// close the channel on the specific websocket
				close(payload.Client.send)

				// if the user doesn't have any active clients then remove the user from the map
				if len(h.users[payload.UserID]) == 0 {
					// remove the key from the map
					delete(h.users, payload.UserID)
				}
			}
		case payload := <-h.broadcast:
			userId := payload.UserID
			message := payload.Message

			clients := make([]*Client, 0)

			// loop over all the connected websockets for this user and handle events for them (keeps different tabs and devices in sync)
			for _, client := range h.users[userId] {
				// if the channel's buffer is full, close it and remove the client from the slice
				if len(client.send) == cap(client.send) {
					close(client.send)
					h.users[userId] = removeClient(h.users[userId], client)

					if len(h.users[userId]) == 0 {
						delete(h.users, userId)
					}
				} else {
					clients = append(clients, client)
				}
			}

			socketPayload := &models.SocketPayload{}
			utils.UnmarshalJSON(message, socketPayload)
			handleSocketEvent(socketPayload, clients, payload.InvokingClient, message)
		}
	}
}

func handleSocketEvent(socketPayload *models.SocketPayload, clients []*Client, invokingClient *Client, message []byte) {
	switch socketPayload.EventType {
	case "post":
		Post(socketPayload, clients, invokingClient)
	case "commentToServer":
		Comment(socketPayload, clients, invokingClient)
	case "deletePost":
		for _, client := range clients {
			client.emitEvent(message)
		}
	case "like":
		for _, client := range clients {
			client.emitEvent(message)
		}
	case "updateProfile":
		UpdateProfile(socketPayload, invokingClient)
	case "removeBirthday":
		RemoveBirthday(socketPayload, invokingClient)
	case "typing":
		fmt.Print("Received typing\n")
		// TODO:
	case "stopTyping":
		fmt.Print("Received stop typing\n")
		// TODO:
	case "markMessagesAsRead":
		fmt.Print("Received mark as read\n")
		// TODO:
	case "message":
		Message(socketPayload, clients, invokingClient)
	case "deleteMessage":
		DeleteMessage(socketPayload, clients, invokingClient, message)
	default:
		fmt.Print("Received unknown")
	}
}
