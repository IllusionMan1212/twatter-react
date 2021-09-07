package models

type SocketPayload struct {
	EventType string      `json:"eventType"`
	Data      interface{} `json:"data"`
}
