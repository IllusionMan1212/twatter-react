package sockets

type UserClientPayload struct {
	UserID uint64
	Client *Client
}

type UserMessagePayload struct {
	UserID  uint64
	Message []byte
}
