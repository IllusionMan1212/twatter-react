import { IMessage, IConversation, IActiveConversation } from "src/types/general";
import { MarkMessagesAsReadPayload, DeleteMessagePayload } from "src/types/socketEvents";

/* Messaging Actions */

export enum MessagingActions {
    CHANGE_CONVERSATION = "CHANGE_CONVERSATION",
    FETCH_MESSAGES = "FETCH_MESSAGES",
    FETCH_CONVERSATIONS = "FETCH_CONVERSATIONS",
    RECEIVE_MESSAGE = "RECEIVE_MESSAGE",
    MARK_AS_READ = "MARK_AS_READ",
    DELETE_MESSAGE = "DELETE_MESSAGE",
    LOAD_MORE_CONVERSATIONS = "LOAD_MORE_CONVERSATIONS",
    LOAD_MORE_MESSAGES = "LOAD_MORE_MESSAGES",
    TOGGLE_MODAL = "TOGGLE_MODAL",
}

interface ChangeConversationAction {
    type: MessagingActions.CHANGE_CONVERSATION,
    payload: {
        activeConversation: IActiveConversation,
        queryConversationId: string
    }
}

interface FetchMessagesAction {
    type: MessagingActions.FETCH_MESSAGES,
    payload: {
        messages: IMessage[]
    }
}

interface FetchConversationsAction {
    type: MessagingActions.FETCH_CONVERSATIONS,
    payload: {
        conversations: IConversation[]
    }
}

interface ReceiveMessageAction {
    type: MessagingActions.RECEIVE_MESSAGE,
    payload: {
        newMessages: IMessage[],
        newConversations: IConversation[]
    }
}

interface MarkMessagesAsReadAction {
    type: MessagingActions.MARK_AS_READ,
    payload: MarkMessagesAsReadPayload
}

interface DeleteMessageAction {
    type: MessagingActions.DELETE_MESSAGE,
    payload: DeleteMessagePayload
}

interface LoadMoreConversationsAction {
    type: MessagingActions.LOAD_MORE_CONVERSATIONS,
    payload: {
        newConversations: IConversation[];
    }
}

interface LoadMoreMessagesAction {
    type: MessagingActions.LOAD_MORE_MESSAGES,
    payload: {
        newMessages: IMessage[];
    }
}

interface ToggleModalAction {
    type: MessagingActions.TOGGLE_MODAL,
    payload: {
        modalAttachment: string;
    }
}

export type MessagingAction =
    ChangeConversationAction |
    FetchMessagesAction |
    FetchConversationsAction |
    ReceiveMessageAction |
    MarkMessagesAsReadAction |
    DeleteMessageAction |
    LoadMoreConversationsAction |
    LoadMoreMessagesAction |
    ToggleModalAction;
