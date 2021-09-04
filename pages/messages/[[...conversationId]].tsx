/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "components/statusBar";
import Navbar from "components/navbar";
import Loading from "components/loading";
import Head from "next/head";
import styles from "styles/messages.module.scss";
import MessagesListItem from "components/messages/messagesListItem";
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
import { IAttachment, IConversation, IActiveConversation } from "src/types/general";
import Link from "next/link";
import MessageMediaModal from "components/messages/messageMediaModal";
import { Virtuoso } from "react-virtuoso";
import {
    fileSizeLimit,
    messageCharLimit,
    supportedFileTypes,
} from "src/utils/variables";
import { useUserContext } from "src/contexts/userContext";

export default function Messages(): ReactElement {
    const START_INDEX = 10000;

    const toast = useToastContext();

    const { user, socket } = useUserContext();

    const messageInputRef = useRef<HTMLSpanElement>(null);
    const virtuosoRef = useRef(null);
    const pageRef = useRef(null);

    const router = useRouter();

    const [charsLeft, setCharsLeft] = useState(messageCharLimit);
    const [sendingAllowed, setSendingAllowed] = useState(false);
    const [attachment, setAttachment] = useState<IAttachment>(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [conversations, setConversations] = useState<IConversation[]>([]);
    const [messagesListLoading, setMessagesListLoading] = useState(true);
    const [activeConversation, setActiveConversation] = useState<IActiveConversation>();
    const [isConversationActive, setIsConversationActive] = useState(false);
    const [messages, setMessages] = useState([]); // TODO: explicitly type this
    const [nowSending, setNowSending] = useState(false);
    const [newMessagesAlert, setNewMessagesAlert] = useState(false);
    const [imageModal, setImageModal] = useState(false);
    const [modalAttachment, setModalAttachment] = useState("");
    const [atBottom, setAtBottom] = useState(false);
    const [typing, setTyping] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null);
    const [page, setPage] = useState(0);
    const [reachedStart, setReachedStart] = useState(false);
    const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);

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
        const payload = {
            eventType: "typing",
            data: {
                receiverId: activeConversation.receiver_id,
                senderId: user.id,
                conversationId: activeConversation.id,
            },
        };
        socket.send(JSON.stringify(payload));

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
                        senderId: user.id,
                        conversationId: activeConversation.id,
                    },
                };
                socket.send(JSON.stringify(payload));
            }, 4000)
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

    const handleMessageRecieved = useCallback(
        (msg) => {
            setNowSending(false);

            // check if the client's active conversation is the one the message was received in
            // this basically ensures that convos that dont have the same id as the receiving message arent updated
            if (activeConversation?.id == msg.conversationId) {
                setTyping(false);
                const newMessages = messages.concat({
                    content: msg.content,
                    sentTime: msg.sentTime,
                    ownerId: msg.sender,
                    attachment: msg.attachment,
                });
                setMessages(newMessages);
                if (!atBottom) {
                    setNewMessagesAlert(true);
                } else {
                    scrollToBottom();
                }
                const payload = {
                    conversationId: msg.conversationId,
                    userId: user.id,
                    unreadMessages: msg.sender == user.id ? 0 : 1,
                };

                // conversation is active, so the user has read the message
                // TODO: socket events and change the payload
                socket.send("markMessagesAsRead", payload);
            }
            const newConversations = conversations.map(
                (conversation: IConversation) => {
                    return conversation.id == msg.conversationId
                        ? {
                              ...conversation,
                              last_message: msg.content
                                  ? msg.content
                                  : msg.sender == user.id
                                  ? `${user.display_name} sent an image`
                                  : `${conversation.receiver.display_name} sent an image`,
                              last_updated: msg.sentTime,
                              unreadMessages:
                                  activeConversation?.id == msg.conversationId
                                      ? 0
                                      : msg.sender == user.id
                                      ? 0
                                      : conversation.unread_messages + 1,
                          }
                        : conversation;
                }
            );
            // sort conversations by latest updated conversation
            newConversations.sort(
                (a, b) =>
                    new Date(b.last_updated).getTime() -
                    new Date(a.last_updated).getTime()
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

    const handleTyping = (conversationId: string) => {
        if (activeConversation?.id == conversationId) {
            setTyping(true);
        }
    };

    const handleStopTyping = (conversationId: string) => {
        if (activeConversation?.id == conversationId) {
            setTyping(false);
        }
    };

    const handleClickSend = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
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
        const payload = {
            conversationId: activeConversation.id,
            receiverId: activeConversation.receiver_id,
            senderId: user.id,
            messageContent: messageContent,
            attachment: attachment,
        };
        messageInputRef.current.textContent = "";
        setAttachment(null);
        setPreviewImage(null);
        setSendingAllowed(false);
        setCharsLeft(messageCharLimit);
        socket.emit("messageToServer", payload);
        // TODO: socket events and change payload
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
        const payload = {
            conversationId: conversation.id,
            userId: user.id,
            unreadMessages: conversation.unread_messages,
        };

        // when a conversation is opened, we mark its messages as read
        // TODO: ditto
        socket.emit("markMessagesAsRead", payload);
        if (router.query?.conversationId?.[0] != conversation.id) {
            // HACK: this works around virutoso not calling the loadMoreMessages function
            // when changing conversations
            router.push("/messages", null, { scroll: false });
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

    const loadMoreMessages = useCallback(() => {
        console.log("loading more messages");
        setPage(pageRef.current + 1);
        getMessages(activeConversation.id).then((newMessages) => {
            if (!newMessages.length) {
                setReachedStart(true);
                return true;
            }
            const messagesToPrepend = newMessages.length;
            const nextFirstItemIndex = firstItemIndex - messagesToPrepend;

            setFirstItemIndex(() => nextFirstItemIndex);
            setMessages((messages) => [...newMessages].concat(messages));
            return false;
        });
    }, [setMessages, messages, page, pageRef, firstItemIndex, reachedStart]);

    useEffect(() => {
        if (atBottom) {
            setNewMessagesAlert(false);
        }
    }, [atBottom, setNewMessagesAlert]);

    useEffect(() => {
        setPage(0);
        pageRef.current = 0;
        setReachedStart(false);
        setFirstItemIndex(START_INDEX);

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
        setMessages([]);
        setIsConversationActive(true);

        getMessages(router.query.conversationId[0]).then((messages) => {
            setMessages(messages);
            if (messages.length < 50) {
                setReachedStart(true);
            }
        });
    }, [router.query?.conversationId, conversations.length]);

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
        axiosInstance
            .get("/messaging/getConversations")
            .then((res) => {
                setConversations(res.data.conversations);
                setMessagesListLoading(false);
            })
            .catch((err) => {
                err?.response?.data?.status != 404 &&
                    toast(
                        err?.response?.data?.message ?? "An error has occurred",
                        5000
                    );
                setMessagesListLoading(false);
            });
    }, [user]);

    useEffect(() => {
        /*
        if (socket?.connected) {
            socket.on("messageFromServer", handleMessageRecieved);
            socket.on("markedMessagesAsRead", handleMarkedMessagesAsRead);
            socket.on("typing", handleTyping);
            socket.on("stopTyping", handleStopTyping);
        }

        return () => {
            if (socket?.connected) {
                socket.off("messageFromServer", handleMessageRecieved);
                socket.off("markedMessagesAsRead", handleMarkedMessagesAsRead);
                socket.off("typing", handleTyping);
                socket.off("stopTyping", handleStopTyping);
            }
        };
        */
    }, [
        handleMessageRecieved,
        handleMarkedMessagesAsRead,
        handleTyping,
        handleStopTyping,
    ]);

    return (
        <>
            <Head>
                <title>Messages - Twatter</title>
                {/* TODO: write meta tags and other important head tags */}
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
                                {!messagesListLoading ? (
                                    <>
                                        {conversations.length ? (
                                            conversations.map(
                                                (conversation) => {
                                                    return (
                                                        <MessagesListItem
                                                            key={
                                                                conversation.id
                                                            }
                                                            receiver={
                                                                conversation.receiver
                                                            }
                                                            lastMessage={
                                                                conversation.last_message
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
                                                        ></MessagesListItem>
                                                    );
                                                }
                                            )
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
                                        className={styles.messagesAreaContainer}
                                    >
                                        <Virtuoso
                                            ref={virtuosoRef}
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
                                                if (bottom) {
                                                    setAtBottom(bottom);
                                                } else {
                                                    setAtBottom(bottom);
                                                }
                                            }}
                                            startReached={loadMoreMessages}
                                            // eslint-disable-next-line react/display-name
                                            components={{
                                                Header: () => {
                                                    return (
                                                        <>
                                                            {reachedStart ? (
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
                                                <Message
                                                    key={index}
                                                    sender={
                                                        user.id ==
                                                        message.ownerId
                                                    }
                                                    sentTime={message.sentTime}
                                                    attachment={
                                                        message.attachment
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
                                                >
                                                    {message.content}
                                                </Message>
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
