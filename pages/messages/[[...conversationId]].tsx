/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "../../components/statusBar";
import NavbarLoggedIn from "../../components/navbarLoggedIn";
import Loading from "../../components/loading";
import { useUser } from "../../src/hooks/useUserHook";
import Head from "next/head";
import styles from "../../styles/messages.module.scss";
import MessagesListItem from "../../components/messagesListItem";
import { ArrowLeft, ImageSquare, PaperPlane, X } from "phosphor-react";
import {
    FormEvent,
    ReactElement,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import Message from "../../components/message";
import { useToastContext } from "../../src/contexts/toastContext";
import axiosInstance from "../../src/axios";
import { useRouter } from "next/router";
import { Attachment, Conversation } from "../../src/types/general";
import { connectSocket, socket } from "../../src/socket";
import Link from "next/link";
import MessageMediaModal from "../../components/messageMediaModal";
import { Virtuoso } from "react-virtuoso";
import {
    fileSizeLimit,
    messageCharLimit,
    supportedFileTypes,
} from "src/utils/variables";

export default function Messages(): ReactElement {
    const toast = useToastContext();

    const user = useUser("/login", null);

    const messageInputRef = useRef<HTMLSpanElement>(null);
    const virtuosoRef = useRef(null);

    const router = useRouter();

    const [charsLeft, setCharsLeft] = useState(messageCharLimit);
    const [sendingAllowed, setSendingAllowed] = useState(false);
    const [attachment, setAttachment] = useState<Attachment>(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [conversations, setConversations] = useState([]); // TODO: explicitly type this
    const [messagesListLoading, setMessagesListLoading] = useState(true);
    const [activeConversation, setActiveConversation] = useState({
        // TODO: turn this into a type
        _id: "",
        receiverId: "",
        display_name: "",
        username: "",
    });
    const [isConversationActive, setIsConversationActive] = useState(false);
    const [messages, setMessages] = useState([]); // TODO: explicitly type this
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [nowSending, setNowSending] = useState(false);
    const [newMessagesAlert, setNewMessagesAlert] = useState(false);
    const [imageModal, setImageModal] = useState(false);
    const [modalAttachment, setModalAttachment] = useState("");
    const [atBottom, setAtBottom] = useState(false);

    const scrollToBottom = () => {
        virtuosoRef.current.scrollToIndex({
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
                        (e as unknown) as React.MouseEvent<
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

            if (
                e.currentTarget.textContent.length > messageCharLimit
            ) {
                setSendingAllowed(false);
            } else if (e.currentTarget.textContent.length) {
                setSendingAllowed(true);
            }
            setCharsLeft(
                messageCharLimit - e.currentTarget.textContent.length
            );
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
            if (activeConversation?._id == msg.conversationId) {
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
                    userId: user._id,
                    unreadMessages: msg.sender == user._id ? 0 : 1,
                };
                socket.emit("markMessagesAsRead", payload); // conversation is active, so the user has read the message
            }
            const newConversations = conversations.map((conversation) => {
                return conversation._id == msg.conversationId
                    ? {
                        ...conversation,
                        lastMessage: msg.content,
                        lastUpdated: msg.sentTime,
                        unreadMessages:
                              activeConversation?._id == msg.conversationId
                                  ? 0
                                  : msg.sender == user._id
                                      ? 0
                                      : conversation.unreadMessages + 1,
                    }
                    : conversation;
            });
            // sort conversations by latest updated conversation
            newConversations.sort(
                (a, b) =>
                    new Date(b.lastUpdated).getTime() -
                    new Date(a.lastUpdated).getTime()
            );
            setConversations(newConversations);
        },
        [activeConversation, messages, conversations]
    );

    const handleMarkedMessagesAsRead = useCallback(
        (payload) => {
            const newConversations = conversations.map((conversation) => {
                return conversation._id == payload.conversationId
                    ? {
                        ...conversation,
                        unreadMessages: 0,
                    }
                    : conversation;
            });
            setConversations(newConversations);
        },
        [conversations]
    );

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
            conversationId: activeConversation._id,
            receiverId: activeConversation.receiverId,
            senderId: user._id,
            messageContent: messageContent,
            attachment: attachment,
        };
        messageInputRef.current.textContent = "";
        setAttachment(null);
        setPreviewImage(null);
        setSendingAllowed(false);
        setCharsLeft(messageCharLimit);
        if (socket) {
            socket?.emit("messageToServer", payload);
        } else {
            console.log("socket not connected, trying to connect");
            connectSocket(user.token);
            socket?.emit("messageToServer", payload);
        }
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

    const handleConversationClick = (conversation: Conversation) => {
        if (conversation._id == activeConversation?._id) {
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
            conversationId: conversation._id,
            userId: user._id,
            unreadMessages: conversation.unreadMessages,
        };
        socket.emit("markMessagesAsRead", payload); // when a conversation is opened, we mark its messages as read
        if (router.query?.conversationId?.[0] != conversation._id) {
            router.push(`/messages/${conversation._id}`, null, {
                shallow: true,
            });
        }
    };

    useEffect(() => {
        if (atBottom) {
            setNewMessagesAlert(false);
        }
    }, [atBottom, setNewMessagesAlert]);

    useEffect(() => {
        if (!router.query?.conversationId?.[0]) {
            setIsConversationActive(false);
            setActiveConversation(null); // used to remove the active class from the last active conversation
            return;
        }
        // if conversations haven't been fetched yet, dont fetch messages
        if (!conversations.length) {
            return;
        }
        // fetches current conversation based on the query in the url (works with back and forward buttons on browsers)
        const newActiveConversation = conversations.find(
            (conversation) => conversation._id == router.query.conversationId[0]
        );
        // if we can't find the query string in our conversations, we just load the normal messages page
        if (!newActiveConversation) {
            return;
        }
        // dont fetch messages if current convo id is equal to new convo id
        // this is to prevent state update from happening when updating convo's last message on socket event
        if (activeConversation?._id == router.query.conversationId[0]) {
            return;
        }
        setActiveConversation({
            _id: router.query.conversationId[0],
            username: newActiveConversation.receivers[0]?.username,
            display_name: newActiveConversation.receivers[0]?.display_name,
            receiverId: newActiveConversation.receivers[0]?._id,
        });
        setMessages([]);
        setMessagesLoading(true);
        setIsConversationActive(true);
        axiosInstance
            .get(`/messaging/getMessages/${router.query.conversationId[0]}`)
            .then((res) => {
                setMessages(res.data.messages);
                setMessagesLoading(false);
                scrollToBottom();
            })
            .catch((err) => {
                toast(
                    err?.response?.data?.message ?? "An error has occurred",
                    5000
                );
                setMessagesLoading(false);
            });
    }, [router.query?.conversationId, conversations]);

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
        socket?.on("messageFromServer", handleMessageRecieved);
        socket?.on("markedMessagesAsRead", handleMarkedMessagesAsRead);

        return () => {
            socket?.off("messageFromServer", handleMessageRecieved);
            socket?.off("markedMessagesAsRead", handleMarkedMessagesAsRead);
        };
    }, [socket, handleMessageRecieved, handleMarkedMessagesAsRead]);

    return (
        <>
            <Head>
                <title>Messages - Twatter</title>
                {/* TODO: write meta tags and other important head tags */}
            </Head>
            {user ? (
                <>
                    <NavbarLoggedIn user={user}></NavbarLoggedIn>
                    <div className="feed">
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
                                                                conversation._id
                                                            }
                                                            receivers={
                                                                conversation.receivers
                                                            }
                                                            lastMessage={
                                                                conversation.lastMessage
                                                            }
                                                            isActive={
                                                                conversation._id ==
                                                                activeConversation?._id
                                                            }
                                                            unreadMessages={
                                                                conversation.unreadMessages
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
                                                messages.length - 1
                                            }
                                            alignToBottom
                                            followOutput
                                            atBottomStateChange={(bottom) => {
                                                if (bottom) {
                                                    setAtBottom(bottom);
                                                } else {
                                                    setAtBottom(bottom);
                                                }
                                            }}
                                            // eslint-disable-next-line react/display-name
                                            components={{Header: () => {
                                                return (
                                                    <>
                                                        {messagesLoading && (
                                                            <Loading
                                                                height="50"
                                                                width="50"
                                                            ></Loading>
                                                        )}
                                                    </>
                                                );
                                            },
                                            }}
                                            itemContent={(index) => (
                                                <Message
                                                    key={index}
                                                    sender={
                                                        user._id ==
                                                        messages[index].ownerId
                                                    }
                                                    sentTime={
                                                        messages[index].sentTime
                                                    }
                                                    attachment={
                                                        messages[index]
                                                            .attachment
                                                    }
                                                    conversationId={
                                                        activeConversation?._id
                                                    }
                                                    setImageModal={
                                                        setImageModal
                                                    }
                                                    setModalAttachment={
                                                        setModalAttachment
                                                    }
                                                >
                                                    {messages[index].content}
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
                                    <div
                                        className={styles.messageInputContainer}
                                    >
                                        <div
                                            className={`${
                                                styles.messageCharLimit
                                            } ${
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
                                                            e.currentTarget.value = null;
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
