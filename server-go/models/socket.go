package models

type SocketMessage struct {
	EventType string      `json:"eventType"`
	Data      interface{} `json:"data"`
}
