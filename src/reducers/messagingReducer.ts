import { MessagingActions, MessagingAction } from "src/types/actions";
import { IConversation, IMessage, IActiveConversation } from "src/types/general";

interface State {
    conversations: IConversation[];
    messages: IMessage[];
    activeConversation: IActiveConversation;
    isConversationActive: boolean;
}

export default function messagingReducer(state: State, action: MessagingAction): State {
    switch (action.type) {
    case MessagingActions.CHANGE_CONVERSATION:
        if (!action.payload.queryConversationId) {
            return {
                ...state,
                messages: [],
                isConversationActive: false,
                activeConversation: null
            };
        }

        return {
            ...state,
            messages: [],
            isConversationActive: true,
            activeConversation: action.payload.activeConversation,
        };
    case MessagingActions.FETCH_MESSAGES:
        return {
            ...state,
            messages: action.payload.messages
        };
    case MessagingActions.FETCH_CONVERSATIONS:
        return {
            ...state,
            conversations: action.payload.conversations
        };
    case MessagingActions.RECEIVE_MESSAGE:
        return {
            ...state,
            messages: state.messages.concat(action.payload.newMessages),
            conversations: action.payload.newConversations
        };
    case MessagingActions.MARK_AS_READ:
        return {
            ...state,
            conversations: state.conversations.map((conversation) => {
                return conversation.id == action.payload.conversationId
                    ? {
                        ...conversation,
                        unread_messages: 0
                    }
                    : conversation;
            })
        };
    case MessagingActions.DELETE_MESSAGE: {
        let newConversations = [] as IConversation[];
        const newMessages = state.messages.map((message, i) => {
            if (message.id == action.payload.message_id) {
                message.deleted = true;
                if (i == (state.messages.length - 1)) {
                    newConversations = state.conversations.map((convo) => {
                        if (convo.id == message.conversation_id) {
                            convo.last_message.String = "";
                            convo.last_message.Valid = false;
                        }
                        return convo;
                    });
                }
            }
            return message;
        });

        return {
            ...state,
            messages: newMessages,
            conversations: newConversations
        };
    }
    case MessagingActions.LOAD_MORE_MESSAGES:
        return {
            ...state,
            messages: [...action.payload.newMessages].concat(state.messages)
        };
    case MessagingActions.LOAD_MORE_CONVERSATIONS:
        return {
            ...state,
            conversations: state.conversations.concat(action.payload.newConversations)
        };
    }
}
