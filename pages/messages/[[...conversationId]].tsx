/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "components/statusBar";
import Navbar from "components/navbar";
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
} from "src/types/general";
import MessageMediaModal from "components/messages/messageMediaModal";
import { useUserContext } from "src/contexts/userContext";
import { DeleteMessagePayload, MarkMessagesAsReadPayload } from "src/types/socketEvents";
import { useGlobalContext } from "src/contexts/globalContext";
import { MessagingActions } from "src/types/actions";
import messagingReducer from "src/reducers/messagingReducer";
import ConversationsList from "components/messages/conversationsList";
import NoActiveConversation from "components/messages/noActiveConversation";
import ActiveConversation from "components/messages/activeConversation";

const initialState = {
    conversations: [] as IConversation[],
    messages: [] as IMessage[],
    activeConversation: null as IActiveConversation,
    isConversationActive: false,
};

export default function Messages(): ReactElement {
    const { setUnreadMessages, setActiveConversationId } = useGlobalContext();

    const { user, socket } = useUserContext();

    const router = useRouter();

    const [state, dispatch] = useReducer(messagingReducer, initialState);

    const [imageModal, setImageModal] = useState(false);
    const [modalAttachment, setModalAttachment] = useState("");

    const handleMarkedMessagesAsRead = useCallback(
        (payload: MarkMessagesAsReadPayload) => {
            dispatch({
                type: MessagingActions.MARK_AS_READ,
                payload
            });

            setUnreadMessages((unreadMessages) => {
                return unreadMessages.filter((conversationId) => {
                    return payload.conversationId != conversationId;
                });
            });
        },
        [setUnreadMessages]
    );

    const handleDeleteMessage = useCallback((payload: DeleteMessagePayload) => {
        dispatch({
            type: MessagingActions.DELETE_MESSAGE,
            payload
        });
    }, []);

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
            socket.on("markedMessagesAsRead", handleMarkedMessagesAsRead);
            socket.on("deleteMessage", handleDeleteMessage);
        }

        return () => {
            if (socket) {
                socket.off("markedMessagesAsRead", handleMarkedMessagesAsRead);
                socket.off("deleteMessage", handleDeleteMessage);
            }
        };
    }, [
        handleMarkedMessagesAsRead,
        handleDeleteMessage,
        socket
    ]);

    if (!user) return <></>;

    return (
        <>
            <Head>
                <title>Messages - Twatter</title>
            </Head>
            <Navbar user={user}></Navbar>
            <div>
                <StatusBar user={user} title="Messages"/>
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
                            setImageModal={setImageModal}
                            setModalAttachment={setModalAttachment}
                        />
                    ): <NoActiveConversation/>}
                    {imageModal && (
                        <MessageMediaModal
                            setImageModal={setImageModal}
                            attachment={modalAttachment}
                        ></MessageMediaModal>
                    )}
                </div>
            </div>
        </>
    );
}
