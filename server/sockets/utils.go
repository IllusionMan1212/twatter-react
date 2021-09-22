package sockets

// function to removeClient from a slice
func removeClient(clients []*Client, client *Client) []*Client {
	for i, v := range clients {
		if v == client {
			return append(clients[:i], clients[i+1:]...)
		}
	}

	return clients
}

func sendGenericSocketErr(client *Client) {
	errPayload := `{
		"eventType": "error",
		"data": {
			"message": "An error has occurred, please try again later"
		}
	}`
	client.emitEvent([]byte(errPayload))
}
