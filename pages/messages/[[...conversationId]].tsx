import Head from "next/head";
import styles from "styles/messages.module.scss";
import {
    ReactElement,
    useCallback,
    useEffect,
    useState,
    useReducer,
} from "react";
import { useRouter } from "next/router";
import {
    IConversation,
    IActiveConversation,
    IMessage,
    ISocketMessage,
} from "src/types/general";
import MessageMediaModal from "components/messages/messageMediaModal";
import { useUserContext } from "src/contexts/userContext";
import { DeleteMessagePayload, MarkMessagesAsReadPayload } from "src/types/socketEvents";
import { useGlobalContext } from "src/contexts/globalContext";
import { MessagingActions } from "src/actions/messagingActions";
import messagingReducer from "src/reducers/messagingReducer";
import ConversationsList from "components/messages/conversationsList";
import NoActiveConversation from "components/messages/noActiveConversation";
import ActiveConversation from "components/messages/activeConversation";

const initialState = {
    conversations: [] as IConversation[],
    messages: [] as IMessage[],
    activeConversation: null as IActiveConversation,
    isConversationActive: false,
    isModalActive: false,
    modalAttachment: "",
};

export default function Messages(): ReactElement {
    const { setUnreadConversations, setActiveConversationId } = useGlobalContext();
    const { user, socket } = useUserContext();

    const router = useRouter();

    const [state, dispatch] = useReducer(messagingReducer, initialState);

    const [atBottom, setAtBottom] = useState(false);
    const [newMessagesAlert, setNewMessagesAlert] = useState(false);
    const [nowSending, setNowSending] = useState(false);

    const handleMarkedMessagesAsRead = useCallback(
        (payload: MarkMessagesAsReadPayload) => {
            dispatch({
                type: MessagingActions.MARK_AS_READ,
                payload
            });

            setUnreadConversations((unreadMessages) => {
                return unreadMessages.filter((conversationId) => {
                    return payload.conversationId != conversationId;
                });
            });
        },
        [setUnreadConversations]
    );

    const handleDeleteMessage = useCallback((payload: DeleteMessagePayload) => {
        dispatch({
            type: MessagingActions.DELETE_MESSAGE,
            payload
        });
    }, []);

    const handleMessageReceived = 
        (msg: ISocketMessage) => {
            if (user.id != msg.receiver_id) {
                setNowSending(false);
            }

            let lastMessage = msg.content;
            if (!msg.content && msg.attachment) {
                if (msg.author_id == user.id) {
                    lastMessage = "You sent an attachment";
                } else {
                    lastMessage = `${state.activeConversation.display_name} sent an attachment`;
                }
            }

            const newConversations = state.conversations.map(
                (conversation: IConversation) => {
                    return conversation.id == msg.conversation_id
                        ? {
                            ...conversation,
                            last_message: {
                                String: lastMessage,
                                Valid: true
                            },
                            last_updated: {
                                Valid: true,
                                Time: new Date(msg.sent_time),
                            },
                            unread_messages:
                                state.activeConversation?.id == msg.conversation_id
                                    ? 0
                                    : msg.author_id == user.id
                                        ? 0
                                        : conversation.unread_messages + 1,
                        }
                        : conversation;
                }
            );
            // sort conversations by latest updated conversation
            newConversations.sort(
                (a, b) =>
                    new Date(b.last_updated.Time.toString()).getTime() -
                    new Date(a.last_updated.Time.toString()).getTime()
            );

            let newMessages = [] as IMessage[];

            // check if the client's active conversation is the one the message was received in
            // this basically ensures that convos that dont have the same id as the receiving message arent updated
            if (state.activeConversation?.id == msg.conversation_id) {
                newMessages = newMessages.concat({
                    id: msg.id,
                    content: msg.content,
                    sent_time: msg.sent_time,
                    author_id: msg.author_id,
                    attachment: msg.attachment,
                    deleted: msg.deleted,
                    conversation_id: msg.conversation_id,
                });

                if (!atBottom) {
                    setNewMessagesAlert(true);
                }

                const payload = {
                    eventType: "markMessagesAsRead",
                    data: {
                        conversationId: msg.conversation_id,
                        userId: user.id,
                    },
                };

                // conversation is active, so the user has read the message
                socket.send(JSON.stringify(payload));
            }

            dispatch({
                type: MessagingActions.RECEIVE_MESSAGE,
                payload: {
                    newMessages,
                    newConversations
                }
            });
        };

    useEffect(() => {
        // dont fetch messages if current convo id is equal to new convo id
        // this is to prevent state update from happening when updating convo's last message on socket event
        if (state.activeConversation?.id == router.query.conversationId?.[0]) {
            return;
        }

        // fetches current conversation based on the query in the url (works with back and forward buttons on browsers)
        const newActiveConversation: IConversation = state.conversations.find(
            (conversation) => conversation.id == router.query.conversationId?.[0]
        );

        // if there's no conversation, just return
        if (!newActiveConversation) {
            return;
        }

        const activeConversation: IActiveConversation = {
            id: router.query.conversationId[0],
            username: newActiveConversation.receiver.username,
            display_name: newActiveConversation.receiver.display_name,
            receiver_id: newActiveConversation.receiver.id,
        };

        setActiveConversationId(router.query.conversationId[0]);

        dispatch({
            type: MessagingActions.CHANGE_CONVERSATION,
            payload: {
                activeConversation: activeConversation,
                queryConversationId: router.query.conversationId[0]
            }
        });

    }, [router.query?.conversationId, state.activeConversation?.id, state.conversations, setActiveConversationId]);

    // when unmounting the entire page, set the global active conversation id to an empty string so we get to receive messages notifications.
    useEffect(() => {
        return () => {
            setActiveConversationId("");
        };
    }, [setActiveConversationId]);

    useEffect(() => {
        if (socket) {
            socket.on("message", handleMessageReceived);
            socket.on("markedMessagesAsRead", handleMarkedMessagesAsRead);
            socket.on("deleteMessage", handleDeleteMessage);
        }

        return () => {
            if (socket) {
                socket.off("message", handleMessageReceived);
                socket.off("markedMessagesAsRead", handleMarkedMessagesAsRead);
                socket.off("deleteMessage", handleDeleteMessage);
            }
        };
    }, [
        handleMessageReceived,
        handleMarkedMessagesAsRead,
        handleDeleteMessage,
        socket
    ]);

    if (!user) return null;

    return (
        <>
            <Head>
                <title>Messages - Twatter</title>
            </Head>
            <div>
                <div
                    className={`text-white ${
                        styles.messagesContainer
                    } ${
                        state.isConversationActive
                            ? styles.messagesContainerMobile
                            : ""
                    }`}
                >
                    <div
                        className={`${styles.messagesList} ${
                            state.isConversationActive
                                ? styles.messagesListMobile
                                : ""
                        } ${
                            !state.conversations.length
                                ? "justify-content-center"
                                : ""
                        }`}
                    >
                        <ConversationsList
                            state={state}
                            dispatch={dispatch}
                        />
                    </div>
                    {state.isConversationActive ? (
                        <ActiveConversation
                            state={state}
                            dispatch={dispatch}
                            atBottom={atBottom}
                            setAtBottom={setAtBottom}
                            newMessagesAlert={newMessagesAlert}
                            setNewMessagesAlert={setNewMessagesAlert}
                            nowSending={nowSending}
                            setNowSending={setNowSending}
                        />
                    ) : <NoActiveConversation/>}
                    {state.isModalActive && (
                        <MessageMediaModal
                            state={state}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
