package sockets

func contains(clients []*Client, client *Client) bool {
	for _, v := range clients {
		if v == client {
			return true
		}
	}

	return false
}

func remove(clients []*Client, client *Client) []*Client {
	for i, v := range clients {
		if v == client {
			return append(clients[:i], clients[i+1:]...)
		}
	}

	return clients
}
