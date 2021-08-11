package sockets

import (
	"fmt"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			// this sends the message to all clients
			// TODO: send to specific clients
			for client := range h.clients {
				// if the channel's buffer is full, close it and remove the client from the hub
				if len(client.send) == cap(client.send) {
					close(client.send)
					delete(h.clients, client)
				} else {
					socketMessage := &models.SocketMessage{}
					utils.UnmarshalJSON(message, socketMessage)

					handleSocketEvent(socketMessage, client, message)
				}
			}
		}
	}
}

func handleSocketEvent(socketMessage *models.SocketMessage, client *Client, message []byte) {
	// TODO: handle more events
	switch socketMessage.EventType {
	case "post":
		fmt.Print("Received post\n")
		Post(socketMessage, client)
	case "commentToServer":
		fmt.Print("Received comment\n")
		Comment(socketMessage, client)
	case "deletePost":
		fmt.Print("Received delete post\n")
		client.send <- message
	case "like":
		fmt.Print("Recieved like post\n")
		client.send <- message
	case "updateProfile":
		fmt.Print("Received edit profile\n")
		UpdateProfile(socketMessage, client)
	case "removeBirthday":
		fmt.Print("Received remove birthday\n")
		RemoveBirthday(socketMessage, client)
	case "typing":
		fmt.Print("Received typing\n")
		// TODO:
	case "stopTyping":
		fmt.Print("Received stop typing")
		// TODO:
	default:
		fmt.Print("Received unknown")
	}
}
