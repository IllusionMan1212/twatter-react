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
} from "react";
import Message from "components/messages/message";
import { useToastContext } from "src/contexts/toastContext";
import axiosInstance from "src/axios";
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
    fileSizeLimit,
    messageCharLimit,
    supportedFileTypes,
} from "src/utils/variables";
import { useUserContext } from "src/contexts/userContext";
import useLatestState from "src/hooks/useLatestState";
import DeletedMessage from "components/messages/deletedMessage";
import { DeleteMessagePayload } from "src/types/socketEvents";

export default function Messages(): ReactElement {
    const START_INDEX = 10000;

    const toast = useToastContext();

    const { user, socket } = useUserContext();

    const messageInputRef = useRef<HTMLSpanElement>(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const pageRef = useRef(null);
    const messagesAreaContainerRef = useRef(null);

    const router = useRouter();

    const [charsLeft, setCharsLeft] = useState(messageCharLimit);
    const [sendingAllowed, setSendingAllowed] = useState(false);
    const [attachment, setAttachment] = useState<IAttachment>(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [conversations, setConversations] = useState<IConversation[]>([]);
    const [conversationsLoading, setConversationsLoading] = useState(true);
    const [activeConversation, setActiveConversation] =
        useState<IActiveConversation>();
    const [isConversationActive, setIsConversationActive] = useState(false);
    const [messages, setMessages] = useState<IMessage[]>([]);
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

    const scrollToBottom = () => {
        virtuosoRef?.current?.scrollToIndex({
            index: messages.length - 1,
            behavior: "smooth",
        });
    };

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
                    receiverId: activeConversation.receiver_id,
                    conversationId: activeConversation.id,
                },
            };
            socket.send(JSON.stringify(payload));
        }

        if (e.currentTarget.textContent.trim().length > messageCharLimit) {
            setSendingAllowed(false);
        } else if (
            e.currentTarget.textContent.trim().length != 0 ||
            attachment
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
                        receiverId: activeConversation.receiver_id,
                        conversationId: activeConversation.id,
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
                !attachment?.data
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

    const handlePaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
        e.preventDefault();
        // handle pasting strings as plain text
        if (e.clipboardData.items?.[0].kind == "string") {
            const text = e.clipboardData.getData("text/plain");
            e.currentTarget.textContent += text;

            if (e.currentTarget.textContent.length > messageCharLimit) {
                setSendingAllowed(false);
            } else if (e.currentTarget.textContent.length) {
                setSendingAllowed(true);
            }
            setCharsLeft(messageCharLimit - e.currentTarget.textContent.length);
            // handle pasting images
        } else if (e.clipboardData.items?.[0].kind == "file") {
            const file = e.clipboardData.items[0].getAsFile();
            if (!supportedFileTypes.includes(file.type)) {
                return;
            }
            if (file.size > fileSizeLimit) {
                toast("File size is limited to 8MB", 4000);
                return;
            }
            setAttachment({
                data: file,
                mimetype: file.type,
                name: file.name,
                size: file.size,
            });
            setPreviewImage(URL.createObjectURL(file));
            if (charsLeft >= 0) {
                setSendingAllowed(true);
            }
        }
    };

    const handleNewMessagesAlertClick = () => {
        scrollToBottom();
        setNewMessagesAlert(false);
    };

    const handleMessageReceived = useCallback(
        (msg: ISocketMessage) => {
            setNowSending(false);

            // check if the client's active conversation is the one the message was received in
            // this basically ensures that convos that dont have the same id as the receiving message arent updated
            if (activeConversation?.id == msg.conversation_id) {
                setTyping(false);
                const newMessages = messages.concat({
                    id: msg.id,
                    content: msg.content,
                    sent_time: msg.sent_time,
                    author_id: msg.author_id,
                    attachment: msg.attachment,
                    deleted: msg.deleted,
                    conversation_id: msg.conversation_id,
                });
                setMessages(newMessages);
                if (!atBottom) {
                    setNewMessagesAlert(true);
                } else {
                    scrollToBottom();
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
            const newConversations = conversations.map(
                (conversation: IConversation) => {
                    return conversation.id == msg.conversation_id
                        ? {
                              ...conversation,
                              last_message: {
                                  String: msg.content,
                                  Valid: true
                              },
                              last_updated: {
                                  Valid: true,
                                  Time: new Date(msg.sent_time),
                              },
                              unread_messages:
                                  activeConversation?.id == msg.conversation_id
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
            setConversations(newConversations);
        },
        [activeConversation, messages, conversations]
    );

    const handleMarkedMessagesAsRead = useCallback(
        (payload) => {
            const newConversations = conversations.map((conversation) => {
                return conversation.id == payload.conversationId
                    ? {
                          ...conversation,
                          unread_messages: 0,
                      }
                    : conversation;
            });
            setConversations(newConversations);
        },
        [conversations]
    );

    const handleTyping = (payload: { conversationId: string }) => {
        if (activeConversation?.id == payload.conversationId) {
            setTyping(true);
        }
    };

    const handleStopTyping = (payload: { conversationId: string }) => {
        if (activeConversation?.id == payload.conversationId) {
            setTyping(false);
        }
    };

    const handleDeleteMessage = (payload: DeleteMessagePayload) => {
        setMessages(messages.map((message, i) => {
            if (message.id == payload.message_id) {
                message.deleted = true;
                if (i == (messages.length - 1)) {
                    setConversations(conversations.map((convo) => {
                        if (convo.id == message.conversation_id) {
                            convo.last_message.String = "";
                            convo.last_message.Valid = false;
                        }
                        return convo;
                    }));
                }
            }
            return message;
        }));
    }

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
            !attachment.data
        ) {
            e.preventDefault();
            return;
        }
        const messageContent = messageInputRef.current.innerText
            .replace(/(\n){2,}/g, "\n\n")
            .trim();
        setNowSending(true);

        const attachmentArrayBuffer = await attachment.data.arrayBuffer();
        const attachmentBuffer = new Uint8Array(attachmentArrayBuffer);
        const data = Buffer.from(attachmentBuffer).toString("base64");

        const payload = {
            eventType: "message",
            data: {
                conversation_id: activeConversation.id,
                receiver_id: activeConversation.receiver_id,
                sender_id: user.id,
                message_content: messageContent,
                attachment: {
                    data: data,
                    mimetype: attachment.mimetype
                },
            },
        };
        messageInputRef.current.textContent = "";
        setAttachment(null);
        setPreviewImage(null);
        setSendingAllowed(false);
        setCharsLeft(messageCharLimit);
        socket.send(JSON.stringify(payload));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file: File = e.target?.files[0];

        if (!supportedFileTypes.includes(file.type)) {
            toast("This file format is not supported", 4000);
            return;
        }
        if (file.size > fileSizeLimit) {
            toast("File size is limited to 8MB", 4000);
            return;
        }
        setAttachment({
            data: file,
            mimetype: file.type,
            name: file.name,
            size: file.size,
        });
        setPreviewImage(URL.createObjectURL(file));
        if (charsLeft >= 0) {
            setSendingAllowed(true);
        }
        // TODO: videos
    };

    const handleImagePreviewClose = () => {
        setPreviewImage(null);
        setAttachment(null);
        if (!messageInputRef.current.textContent.trim().length) {
            setSendingAllowed(false);
        }
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
        if (conversation.id == activeConversation?.id) {
            return;
        }
        if (messageInputRef && messageInputRef.current) {
            messageInputRef.current.innerHTML = "";
            setSendingAllowed(false);
            setCharsLeft(messageCharLimit);
            setAttachment(null);
            setPreviewImage(null);
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

    const getMessages = (conversationId: string): Promise<any> => {
        return axiosInstance
            .get(`/messaging/getMessages/${conversationId}/${pageRef.current}`)
            .then((res) => {
                return res.data.messages;
            })
            .catch((err) => {
                toast(
                    err?.response?.data?.message ?? "An error has occurred",
                    5000
                );
            });
    };

    const getConversations = (): Promise<any> => {
        return axiosInstance
            .get(`/messaging/getConversations/${conversationsPage.current}`)
            .then((res) => {
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
    };

    const loadMoreMessages = useCallback(() => {
        console.log("loading more messages");
        setPage(pageRef.current + 1);
        getMessages(activeConversation.id).then((newMessages) => {
            if (!newMessages.length) {
                setReachedStartOfMessages(true);
                return;
            }
            const messagesToPrepend = newMessages.length;
            const nextFirstItemIndex = firstItemIndex - messagesToPrepend;

            setFirstItemIndex(nextFirstItemIndex);
            setMessages((messages) => [...newMessages].concat(messages));
            return;
        });
    }, [
        setMessages,
        messages,
        page,
        pageRef,
        firstItemIndex,
        reachedStartOfMessages
    ]);

    const loadMoreConversations = useCallback(() => {
        setConversationsPage(conversationsPage.current + 1);
        getConversations().then((newConversations) => {
            if (!newConversations.length) {
                setReachedEndOfConvos(true);
                return;
            }

            setConversations(conversations.concat(newConversations));
            return;
        });
    }, [conversations, conversationsPage.current]);

    useEffect(() => {
        if (atBottom) {
            setNewMessagesAlert(false);
        }
    }, [atBottom, setNewMessagesAlert]);

    useEffect(() => {
        if (!router.query?.conversationId?.[0]) {
            setIsConversationActive(false);

            // used to remove the active class from the last active conversation
            setActiveConversation(null);
            return;
        }
        // if conversations haven't been fetched yet, dont fetch messages
        if (!conversations.length) {
            return;
        }
        // fetches current conversation based on the query in the url (works with back and forward buttons on browsers)
        const newActiveConversation = conversations.find(
            (conversation) => conversation.id == router.query.conversationId[0]
        );
        // if we can't find the query string in our conversations, we just load the normal messages page
        if (!newActiveConversation) {
            return;
        }
        // dont fetch messages if current convo id is equal to new convo id
        // this is to prevent state update from happening when updating convo's last message on socket event
        if (activeConversation?.id == router.query.conversationId[0]) {
            return;
        }
        setActiveConversation({
            id: router.query.conversationId[0],
            username: newActiveConversation.receiver?.username,
            display_name: newActiveConversation.receiver?.display_name,
            receiver_id: newActiveConversation.receiver?.id,
        });
        setIsConversationActive(true);

        getMessages(router.query.conversationId[0]).then((messages) => {
            if (messages.length < 50) {
                setReachedStartOfMessages(true);
            }
            setMessages(messages);
        });

        return () => {
            setActiveConversation(null);
            setIsConversationActive(false);
            setMessages([]);
            setPage(0);
            pageRef.current = 0;
            setReachedStartOfMessages(false);
            setFirstItemIndex(START_INDEX);
        }
    }, [router.query?.conversationId, conversations?.length]);

    useEffect(() => {
        messageInputRef?.current?.addEventListener(
            "textInput",
            handleTextInput as never
        );

        return () => {
            messageInputRef?.current?.removeEventListener(
                "textInput",
                handleTextInput as never
            );
        };
    });

    useEffect(() => {
        if (user) {
            getConversations().then((_conversations) => {
                setConversations(_conversations);
                setConversationsLoading(false);
            });
        }
    }, [user]);

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
                                isConversationActive
                                    ? styles.messagesContainerMobile
                                    : ""
                            }`}
                        >
                            <div
                                className={`${styles.messagesList} ${
                                    isConversationActive
                                        ? styles.messagesListMobile
                                        : ""
                                } ${
                                    !conversations.length
                                        ? "justify-content-center"
                                        : ""
                                }`}
                            >
                                {!conversationsLoading ? (
                                    <>
                                        {conversations.length ? (
                                            <Virtuoso
                                                data={conversations}
                                                style={{ width: "100%" }}
                                                totalCount={
                                                    conversations.length
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
                                                                activeConversation?.id
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
                            {isConversationActive && (
                                <div
                                    className={`${styles.conversation} ${
                                        isConversationActive
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
                                        {activeConversation?.username ? (
                                            <>
                                                <Link
                                                    href={`/u/${activeConversation?.username}`}
                                                >
                                                    <a>
                                                        <p className="text-bold text-large">
                                                            {
                                                                activeConversation?.display_name
                                                            }
                                                        </p>
                                                    </a>
                                                </Link>
                                                <Link
                                                    href={`/u/${activeConversation?.username}`}
                                                >
                                                    <a>
                                                        <p
                                                            className={
                                                                styles.username
                                                            }
                                                        >
                                                            @
                                                            {
                                                                activeConversation?.username
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
                                            key={activeConversation?.id}
                                            className={styles.messagesArea}
                                            totalCount={messages.length}
                                            initialTopMostItemIndex={
                                                messages.length > 0
                                                    ? messages.length - 1
                                                    : 0
                                            }
                                            data={messages}
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
                                                                activeConversation?.receiver_id
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
                                                                activeConversation?.id
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
                                                                activeConversation?.id
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
                                            {activeConversation.display_name} is
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
                                        {previewImage && (
                                            <div
                                                className={
                                                    styles.messageAttachment
                                                }
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
                                                        onClick={
                                                            handleImagePreviewClose
                                                        }
                                                    >
                                                        <X weight="bold"></X>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div
                                            className={styles.messageInputArea}
                                        >
                                            <span
                                                ref={messageInputRef}
                                                className={styles.messageInput}
                                                contentEditable="true"
                                                data-placeholder="Send a message..."
                                                onInput={handleInput}
                                                onPaste={handlePaste}
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
                                                        onChange={handleChange}
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
