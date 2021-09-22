package sockets

type UserClientPayload struct {
	UserID string
	Client *Client
}

type UserMessagePayload struct {
	UserID         string
	Message        []byte
	InvokingClient *Client
}
