/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "components/statusBar";
import Navbar from "components/navbar";
import Loading from "components/loading";
import Head from "next/head";
import styles from "styles/messages.module.scss";
import ConversationsListItem from "components/messages/conversationsListItem";
import { ArrowLeft, ImageSquare, PaperPlane, X } from "phosphor-react";
import {
    FormEvent,
    ReactElement,
    useCallback,
    useEffect,
    useRef,
    useState,
    useReducer,
} from "react";
import Message from "components/messages/message";
import { useToastContext } from "src/contexts/toastContext";
import axiosInstance from "src/axios";
import { AxiosResponse } from "axios";
import { useRouter } from "next/router";
import {
    IAttachment,
    IConversation,
    IActiveConversation,
    IMessage,
    ISocketMessage,
} from "src/types/general";
import Link from "next/link";
import MessageMediaModal from "components/messages/messageMediaModal";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import {
    messageCharLimit,
} from "src/utils/variables";
import { useUserContext } from "src/contexts/userContext";
import useLatestState from "src/hooks/useLatestState";
import DeletedMessage from "components/messages/deletedMessage";
import { DeleteMessagePayload, MarkMessagesAsReadPayload } from "src/types/socketEvents";
import { useGlobalContext } from "src/contexts/globalContext";
import { MessagingActions } from "src/types/actions";
import messagingReducer from "src/reducers/messagingReducer";
import { handlePaste, handlePreviewImageClose, handleAttachmentChange } from "src/utils/eventHandlers";

const initialState = {
    conversations: [] as IConversation[],
    messages: [] as IMessage[],
    activeConversation: null as IActiveConversation,
    isConversationActive: false
};

export default function Messages(): ReactElement {
    const START_INDEX = 10000;

    const toast = useToastContext();
    const { setUnreadMessages, setActiveConversationId } = useGlobalContext();

    const { user, socket } = useUserContext();

    const messageInputRef = useRef<HTMLSpanElement>(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const pageRef = useRef(null);
    const messagesAreaContainerRef = useRef(null);

    const router = useRouter();

    const [state, dispatch] = useReducer(messagingReducer, initialState);

    const [charsLeft, setCharsLeft] = useState(messageCharLimit);
    const [sendingAllowed, setSendingAllowed] = useState(false);
    const [attachments, setAttachments] = useState<IAttachment[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [conversationsLoading, setConversationsLoading] = useState(true);
    const [nowSending, setNowSending] = useState(false);
    const [newMessagesAlert, setNewMessagesAlert] = useState(false);
    const [imageModal, setImageModal] = useState(false);
    const [modalAttachment, setModalAttachment] = useState("");
    const [atBottom, setAtBottom] = useState(false);
    const [typing, setTyping] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null);
    const [page, setPage] = useState(0);
    const [reachedStartOfMessages, setReachedStartOfMessages] = useState(false);
    const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
    const [conversationsPage, setConversationsPage] = useLatestState(0);
    const [reachedEndOfConvos, setReachedEndOfConvos] = useState(false);

    pageRef.current = page;

    const scrollToBottom = useCallback(() => {
        virtuosoRef?.current?.scrollToIndex({
            index: state.messages.length - 1,
            behavior: "smooth",
        });
    }, [state.messages.length]);

    const handleClickBack = () => {
        router.back();
    };

    const handleFocus = () => {
        scrollToBottom();
    };

    const handleInput = (e: FormEvent<HTMLInputElement>) => {
        clearTimeout(timeoutId);

        if (!timeoutId) {
            const payload = {
                eventType: "typing",
                data: {
                    receiverId: state.activeConversation.receiver_id,
                    conversationId: state.activeConversation.id,
                },
            };
            socket.send(JSON.stringify(payload));
        }

        if (e.currentTarget.textContent.trim().length > messageCharLimit) {
            setSendingAllowed(false);
        } else if (
            e.currentTarget.textContent.trim().length != 0 ||
            attachments.length
        ) {
            setSendingAllowed(true);
        } else {
            setSendingAllowed(false);
        }
        setCharsLeft(
            messageCharLimit - e.currentTarget.textContent.trim().length
        );
        setTimeoutId(
            setTimeout(() => {
                const payload = {
                    eventType: "stopTyping",
                    data: {
                        receiverId: state.activeConversation.receiver_id,
                        conversationId: state.activeConversation.id,
                    },
                };
                setTimeoutId(null);
                socket.send(JSON.stringify(payload));
            }, 3500)
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (e.key == "Enter") {
            e.preventDefault();

            if (
                !messageInputRef.current.textContent.length &&
                !attachments?.[0]?.data
            )
                return;

            if (window.innerWidth > 800) {
                !e.shiftKey &&
                    handleClickSend(
                        e as unknown as React.MouseEvent<
                            HTMLElement,
                            MouseEvent
                        >
                    );
                e.shiftKey && document.execCommand("insertLineBreak");
            } else if (window.innerWidth <= 800) {
                document.execCommand("insertLineBreak");
            }
        }
    };

    const handleNewMessagesAlertClick = () => {
        scrollToBottom();
        setNewMessagesAlert(false);
    };

    const handleMessageReceived = useCallback(
        (msg: ISocketMessage) => {
            if (msg.receiver_id != user.id) {
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
                setTyping(false);
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
        },
        [state.activeConversation, state.conversations, atBottom, socket, user?.id]
    );

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

    const handleTyping = useCallback((payload: { conversationId: string }) => {
        if (state.activeConversation?.id == payload.conversationId) {
            setTyping(true);
        }
    }, [state.activeConversation?.id]);

    const handleStopTyping = useCallback((payload: { conversationId: string }) => {
        if (state.activeConversation?.id == payload.conversationId) {
            setTyping(false);
        }
    }, [state.activeConversation?.id]);

    const handleDeleteMessage = useCallback((payload: DeleteMessagePayload) => {
        dispatch({
            type: MessagingActions.DELETE_MESSAGE,
            payload
        });
    }, []);

    const handleClickSend = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (!sendingAllowed) {
            e.preventDefault();
            return;
        }
        if (
            messageInputRef.current.textContent.trim().length > messageCharLimit
        ) {
            e.preventDefault();
            return;
        }
        if (
            messageInputRef.current.textContent.length == 0 &&
            !attachments.length
        ) {
            e.preventDefault();
            return;
        }
        const messageContent = messageInputRef.current.innerText
            .replace(/(\n){2,}/g, "\n\n")
            .trim();
        setNowSending(true);

        const attachmentArrayBuffer = await attachments?.[0]?.data.arrayBuffer();
        const attachmentBuffer = new Uint8Array(attachmentArrayBuffer);
        const data = Buffer.from(attachmentBuffer).toString("base64");

        const payload = {
            eventType: "message",
            data: {
                conversation_id: state.activeConversation.id,
                receiver_id: state.activeConversation.receiver_id,
                sender_id: user.id,
                message_content: messageContent,
                attachment: {
                    data: data || "",
                    mimetype: attachments?.[0]?.mimetype || ""
                },
            },
        };
        messageInputRef.current.textContent = "";
        setAttachments([]);
        setPreviewImages([]);
        setSendingAllowed(false);
        setCharsLeft(messageCharLimit);
        socket.send(JSON.stringify(payload));
    };

    const handleTextInput = (e: InputEvent) => {
        // workaround android not giving out proper key codes
        if (window.innerWidth <= 800) {
            if (
                e.data.charCodeAt(0) == 10 ||
                e.data.charCodeAt(e.data.length - 1) == 10
            ) {
                e.preventDefault();
                document.execCommand("insertLineBreak");
            }
        }
    };

    const handleConversationClick = (conversation: IConversation) => {
        if (conversation.id == state.activeConversation?.id) {
            return;
        }

        if (messageInputRef && messageInputRef.current) {
            messageInputRef.current.innerHTML = "";
            setSendingAllowed(false);
            setCharsLeft(messageCharLimit);
            setAttachments([]);
            setPreviewImages([]);
        }

        if (conversation.unread_messages) {
            const payload = {
                eventType: "markMessagesAsRead",
                data: {
                    conversationId: conversation.id,
                    userId: user.id,
                },
            };

            // when a conversation is opened, we mark its messages as read
            socket.send(JSON.stringify(payload));
        }

        if (router.query?.conversationId?.[0] != conversation.id) {
            router.push(`/messages/${conversation.id}`, null, {
                scroll: false,
            });
        }
    };

    const getMessages = useCallback((conversationId: string): Promise<IMessage[] | void> => {
        return axiosInstance
            .get(`/messaging/getMessages/${conversationId}/${pageRef.current}`)
            .then((res: AxiosResponse<{ messages: IMessage[] }>) => {
                return res.data.messages;
            })
            .catch((err) => {
                toast(
                    err?.response?.data?.message ?? "An error has occurred",
                    5000
                );
            });
    }, [toast]);

    const getConversations = useCallback((): Promise<IConversation[] | void> => {
        return axiosInstance
            .get(`/messaging/getConversations/${conversationsPage.current}`)
            .then((res: AxiosResponse<{ conversations: IConversation[] }>) => {
                return res.data.conversations;
            })
            .catch((err) => {
                err?.response?.data?.status != 404 &&
                    toast(
                        err?.response?.data?.message ?? "An error has occurred",
                        5000
                    );
                setConversationsLoading(false);
            });
    }, [conversationsPage, toast]);

    const loadMoreMessages = useCallback(() => {
        setPage(pageRef.current + 1);
        getMessages(state.activeConversation.id).then((newMessages) => {
            if (!(newMessages as IMessage[]).length) {
                setReachedStartOfMessages(true);
                return;
            }
            const messagesToPrepend = (newMessages as IMessage[]).length;
            const nextFirstItemIndex = firstItemIndex - messagesToPrepend;

            setFirstItemIndex(nextFirstItemIndex);

            dispatch({
                type: MessagingActions.LOAD_MORE_MESSAGES,
                payload: {
                    newMessages: newMessages as IMessage[]
                }
            });
            return;
        });
    }, [
        pageRef,
        firstItemIndex,
        state.activeConversation?.id,
        getMessages
    ]);

    const loadMoreConversations = useCallback(() => {
        setConversationsPage(conversationsPage.current + 1);
        getConversations().then((newConversations) => {
            if (!(newConversations as IConversation[]).length) {
                setReachedEndOfConvos(true);
                return;
            }

            dispatch({
                type: MessagingActions.LOAD_MORE_CONVERSATIONS,
                payload: {
                    newConversations: (newConversations as IConversation[])
                }
            });
        });
    }, [conversationsPage, getConversations, setConversationsPage]);

    useEffect(() => {
        if (atBottom) {
            setNewMessagesAlert(false);
        }
    }, [atBottom, setNewMessagesAlert]);

    useEffect(() => {
        // dont fetch messages if current convo id is equal to new convo id
        // this is to prevent state update from happening when updating convo's last message on socket event
        if (state.activeConversation?.id == router.query.conversationId?.[0]) {
            return;
        }

        setPage(0);
        pageRef.current = 0;
        setReachedStartOfMessages(false);
        setFirstItemIndex(START_INDEX);

        // fetches current conversation based on the query in the url (works with back and forward buttons on browsers)
        const newActiveConversation: IConversation = state.conversations.find(
            (conversation) => conversation.id == router.query.conversationId?.[0]
        );

        // if we can't find the query string in our conversations, we just load the normal messages page
        if (!newActiveConversation) {
            dispatch({
                type: MessagingActions.CHANGE_CONVERSATION,
                payload: {
                    activeConversation: null,
                    queryConversationId: null
                }
            });
            setActiveConversationId("");
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

        getMessages(router.query.conversationId[0]).then((_messages) => {
            if ((_messages as IMessage[]).length < 50) {
                setReachedStartOfMessages(true);
            }

            dispatch({
                type: MessagingActions.FETCH_MESSAGES,
                payload: {
                    messages: _messages as IMessage[]
                }
            });
        });
    }, [router.query?.conversationId, state.activeConversation?.id, state.conversations, getMessages, setActiveConversationId]);

    useEffect(() => {
        const messageInput = messageInputRef?.current;
        messageInput?.addEventListener(
            "textInput",
            handleTextInput as never
        );

        return () => {
            messageInput?.removeEventListener(
                "textInput",
                handleTextInput as never
            );
        };
    });

    useEffect(() => {
        if (user) {
            getConversations().then((_conversations) => {
                dispatch({
                    type: MessagingActions.FETCH_CONVERSATIONS,
                    payload: {
                        conversations: _conversations as IConversation[],
                    }
                });
                setConversationsLoading(false);
            });
        }
    }, [user]);

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
            socket.on("typing", handleTyping);
            socket.on("stopTyping", handleStopTyping);
            socket.on("deleteMessage", handleDeleteMessage);
        }

        return () => {
            if (socket) {
                socket.off("message", handleMessageReceived);
                socket.off("markedMessagesAsRead", handleMarkedMessagesAsRead);
                socket.off("typing", handleTyping);
                socket.off("stopTyping", handleStopTyping);
                socket.off("deleteMessage", handleDeleteMessage);
            }
        };
    }, [
        handleMessageReceived,
        handleMarkedMessagesAsRead,
        handleTyping,
        handleStopTyping,
        handleDeleteMessage,
        socket
    ]);

    return (
        <>
            <Head>
                <title>Messages - Twatter</title>
            </Head>
            {user ? (
                <>
                    <Navbar user={user}></Navbar>
                    <div>
                        <StatusBar user={user} title="Messages"></StatusBar>
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
                                {!conversationsLoading ? (
                                    <>
                                        {state.conversations.length ? (
                                            <Virtuoso
                                                data={state.conversations}
                                                style={{ width: "100%" }}
                                                totalCount={
                                                    state.conversations.length
                                                }
                                                // eslint-disable-next-line react/display-name
                                                components={{
                                                    Footer: () => {
                                                        return (
                                                            <>
                                                                {!reachedEndOfConvos ? (
                                                                    <div className="py-3">
                                                                        <Loading
                                                                            height="50"
                                                                            width="50"
                                                                        ></Loading>
                                                                    </div>
                                                                ) : null}
                                                            </>
                                                        );
                                                    },
                                                }}
                                                endReached={
                                                    loadMoreConversations
                                                }
                                                itemContent={(
                                                    _,
                                                    conversation
                                                ) => {
                                                    return (
                                                        <ConversationsListItem
                                                            key={
                                                                conversation.id
                                                            }
                                                            receiver={
                                                                conversation.receiver
                                                            }
                                                            lastMessage={
                                                                conversation.last_message.String
                                                            }
                                                            lastUpdated={
                                                                conversation.last_updated
                                                            }
                                                            isActive={
                                                                conversation.id ==
                                                                state.activeConversation?.id
                                                            }
                                                            unreadMessages={
                                                                conversation.unread_messages
                                                            }
                                                            onClick={() => {
                                                                handleConversationClick(
                                                                    conversation
                                                                );
                                                            }}
                                                        ></ConversationsListItem>
                                                    );
                                                }}
                                            ></Virtuoso>
                                        ) : (
                                            <div className="text-bold text-large">
                                                It&apos;s empty in here :(
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Loading height="50" width="50"></Loading>
                                )}
                            </div>
                            {state.isConversationActive && (
                                <div
                                    className={`${styles.conversation} ${
                                        state.isConversationActive
                                            ? styles.conversationMobile
                                            : ""
                                    }`}
                                >
                                    <div className={styles.user}>
                                        <div
                                            className={styles.backButton}
                                            onClick={handleClickBack}
                                        >
                                            <ArrowLeft size="30"></ArrowLeft>
                                        </div>
                                        {state.activeConversation?.username ? (
                                            <>
                                                <Link
                                                    href={`/u/${state.activeConversation?.username}`}
                                                >
                                                    <a>
                                                        <p className="text-bold text-medium">
                                                            {
                                                                state.activeConversation?.display_name
                                                            }
                                                        </p>
                                                        <p
                                                            className={
                                                                styles.username
                                                            }
                                                        >
                                                            @
                                                            {
                                                                state.activeConversation?.username
                                                            }
                                                        </p>
                                                    </a>
                                                </Link>
                                            </>
                                        ) : (
                                            <p className="text-bold text-large">
                                                Deleted Account
                                            </p>
                                        )}
                                    </div>
                                    <div
                                        ref={messagesAreaContainerRef}
                                        className={styles.messagesAreaContainer}
                                    >
                                        <Virtuoso
                                            ref={virtuosoRef}
                                            key={state.activeConversation?.id}
                                            className={styles.messagesArea}
                                            totalCount={state.messages.length}
                                            initialTopMostItemIndex={
                                                state.messages.length > 0
                                                    ? state.messages.length - 1
                                                    : 0
                                            }
                                            data={state.messages}
                                            firstItemIndex={firstItemIndex}
                                            alignToBottom
                                            followOutput
                                            atBottomStateChange={(bottom) => {
                                                setAtBottom(bottom);
                                            }}
                                            startReached={loadMoreMessages}
                                            // eslint-disable-next-line react/display-name
                                            components={{
                                                Header: () => {
                                                    return (
                                                        <>
                                                            {reachedStartOfMessages ? (
                                                                <div className="usernameGrey text-center text-bold py-3">
                                                                    <p>
                                                                        You have
                                                                        reached
                                                                        the
                                                                        beginning
                                                                        of this
                                                                        conversation
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="py-3">
                                                                    <Loading
                                                                        height="50"
                                                                        width="50"
                                                                    ></Loading>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                },
                                            }}
                                            itemContent={(index, message) => (
                                                <>
                                                    {!message.deleted ? (
                                                        <Message
                                                            key={message.id}
                                                            messageId={
                                                                message.id
                                                            }
                                                            messageAuthorId={
                                                                message.author_id
                                                            }
                                                            receiverId={
                                                                state.activeConversation?.receiver_id
                                                            }
                                                            sender={
                                                                user.id ==
                                                                message.author_id
                                                            }
                                                            sentTime={
                                                                message.sent_time
                                                            }
                                                            attachment={
                                                                message
                                                                    .attachment
                                                                    .url
                                                            }
                                                            conversationId={
                                                                state.activeConversation?.id
                                                            }
                                                            setImageModal={
                                                                setImageModal
                                                            }
                                                            setModalAttachment={
                                                                setModalAttachment
                                                            }
                                                            parentContainerRef={
                                                                messagesAreaContainerRef
                                                            }
                                                        >
                                                            {message.content}
                                                        </Message>
                                                    ) : (
                                                        <DeletedMessage
                                                            key={index}
                                                            sender={
                                                                user.id ==
                                                                message.author_id
                                                            }
                                                            sentTime={
                                                                message.sent_time
                                                            }
                                                            conversationId={
                                                                state.activeConversation?.id
                                                            }
                                                        />
                                                    )}
                                                </>
                                            )}
                                        ></Virtuoso>
                                        {newMessagesAlert && (
                                            <div
                                                className={
                                                    styles.newMessagesAlert
                                                }
                                                onClick={
                                                    handleNewMessagesAlertClick
                                                }
                                            >
                                                New Message(s)
                                            </div>
                                        )}
                                    </div>
                                    {typing && (
                                        <div className={styles.typing}>
                                            {state.activeConversation.display_name} is
                                            typing...
                                        </div>
                                    )}
                                    <div
                                        className={styles.messageInputContainer}
                                    >
                                        <div
                                            className={`${styles.charLimit} ${
                                                charsLeft < 0
                                                    ? styles.charLimitReached
                                                    : ""
                                            }`}
                                            style={{
                                                width: `${
                                                    ((messageCharLimit -
                                                        charsLeft) *
                                                        100) /
                                                    messageCharLimit
                                                }%`,
                                            }}
                                        ></div>
                                        <div
                                            className={`${styles.progressBar} ${
                                                nowSending
                                                    ? styles.progressBarInProgress
                                                    : ""
                                            }`}
                                        ></div>
                                        {previewImages.map((previewImage, i) => {
                                            return (
                                                <div
                                                    className={
                                                        styles.messageAttachment
                                                    }
                                                    key={i}
                                                >
                                                    <div
                                                        className={
                                                            styles.previewImage
                                                        }
                                                        style={{
                                                            backgroundImage: `url("${previewImage}")`,
                                                        }}
                                                    >
                                                        <div
                                                            className={
                                                                styles.previewImageClose
                                                            }
                                                            onClick={(e) => {
                                                                handlePreviewImageClose(
                                                                    e,
                                                                    i,
                                                                    previewImages,
                                                                    setPreviewImages,
                                                                    attachments,
                                                                    setAttachments,
                                                                    messageInputRef,
                                                                    setSendingAllowed
                                                                );
                                                            }}
                                                        >
                                                            <X weight="bold"></X>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div
                                            className={styles.messageInputArea}
                                        >
                                            <span
                                                ref={messageInputRef}
                                                className={styles.messageInput}
                                                contentEditable="true"
                                                data-placeholder="Send a message..."
                                                onInput={handleInput}
                                                onPaste={(e) => {
                                                    handlePaste(
                                                        e,
                                                        messageCharLimit,
                                                        charsLeft,
                                                        setCharsLeft,
                                                        setSendingAllowed,
                                                        previewImages,
                                                        setPreviewImages,
                                                        attachments,
                                                        setAttachments,
                                                        toast,
                                                        1
                                                    );
                                                }}
                                                onKeyDown={handleKeyDown}
                                                onFocus={handleFocus}
                                            ></span>
                                            <div
                                                className={`flex ${styles.messageInputOptions}`}
                                            >
                                                <div
                                                    className={`${styles.sendMessageButton}`}
                                                >
                                                    <ImageSquare size="30"></ImageSquare>
                                                    <input
                                                        className={
                                                            styles.fileInput
                                                        }
                                                        onChange={(e) => {
                                                            handleAttachmentChange(
                                                                e,
                                                                attachments,
                                                                setAttachments,
                                                                previewImages,
                                                                setPreviewImages,
                                                                setSendingAllowed,
                                                                toast,
                                                                1
                                                            );
                                                        }}
                                                        onClick={(e) => {
                                                            e.currentTarget.value =
                                                                null;
                                                        }}
                                                        type="file"
                                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                    />
                                                </div>
                                                <button
                                                    className={styles.button}
                                                    disabled={
                                                        sendingAllowed
                                                            ? false
                                                            : true
                                                    }
                                                    onClick={handleClickSend}
                                                >
                                                    <PaperPlane
                                                        size="30"
                                                        color="#6067fe"
                                                        opacity={
                                                            sendingAllowed
                                                                ? "1"
                                                                : "0.3"
                                                        }
                                                    ></PaperPlane>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {imageModal && (
                                <MessageMediaModal
                                    setImageModal={setImageModal}
                                    attachment={modalAttachment}
                                ></MessageMediaModal>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <Loading height="100" width="100"></Loading>
                </>
            )}
        </>
    );
}
