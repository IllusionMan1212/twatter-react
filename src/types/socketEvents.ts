export interface DeleteMessagePayload {
    message_id: string;
    receiver_id: string;
}

export interface MarkMessagesAsReadPayload {
    conversationId: string;
}
