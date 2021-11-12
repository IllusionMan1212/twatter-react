import { useRouter } from "next/router";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "phosphor-react";
import Message from "components/messages/message";
import Link from "next/link";
import DeletedMessage from "components/messages/deletedMessage";
import MessageBox from "components/messages/messageBox";
import { VirtuosoHandle, Virtuoso } from "react-virtuoso";
import { useUserContext } from "src/contexts/userContext";
import Loading from "components/loading";
import { MessagingActions } from "src/types/actions";
import styles from "./activeConversation.module.scss";
import { ActiveConversationProps } from "src/types/props";
import { IAttachment, IConversation, IMessage, ISocketMessage } from "src/types/general";
import axiosInstance from "src/axios";
import { AxiosResponse } from "axios";
import { useToastContext } from "src/contexts/toastContext";
import { messageCharLimit } from "src/utils/variables";
import { useGlobalContext } from "src/contexts/globalContext";

export default function ActiveConversation(props: ActiveConversationProps): ReactElement {
    const START_INDEX = 10000;

    const { user, socket } = useUserContext();
    const toast = useToastContext();
    const { setActiveConversationId } = useGlobalContext();

    const router = useRouter();

    const pageRef = useRef(null);
    const messagesAreaContainerRef = useRef(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const messageBoxRef = useRef<HTMLSpanElement>(null);

    const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
    const [page, setPage] = useState(0);
    const [reachedStartOfMessages, setReachedStartOfMessages] = useState(false);
    const [atBottom, setAtBottom] = useState(false);
    const [newMessagesAlert, setNewMessagesAlert] = useState(false);
    const [nowSending, setNowSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const [charsLeft, setCharsLeft] = useState(messageCharLimit);
    const [sendingAllowed, setSendingAllowed] = useState(false);
    const [attachments, setAttachments] = useState<IAttachment[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    pageRef.current = page;

    const handleClickBack = () => {
        router.back();
    };

    const handleNewMessagesAlertClick = () => {
        scrollToBottom();
        setNewMessagesAlert(false);
    };

    const scrollToBottom = useCallback(() => {
        virtuosoRef?.current?.scrollToIndex({
            index: props.state.messages.length - 1,
            behavior: "smooth",
        });
    }, [props.state.messages.length]);

    const getMessages = useCallback((conversationId: string): Promise<IMessage[]> => {
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
                return [];
            });
    }, [toast]);

    const loadMoreMessages = useCallback(() => {
        setPage(pageRef.current + 1);
        getMessages(props.state.activeConversation.id).then((newMessages) => {
            if (!newMessages.length) {
                setReachedStartOfMessages(true);
                return;
            }
            const messagesToPrepend = newMessages.length;
            const nextFirstItemIndex = firstItemIndex - messagesToPrepend;

            setFirstItemIndex(nextFirstItemIndex);

            props.dispatch({
                type: MessagingActions.LOAD_MORE_MESSAGES,
                payload: {
                    newMessages: newMessages,
                },
            });
            return;
        });
    }, [pageRef, firstItemIndex, props.state.activeConversation?.id, getMessages]);

    const handleTyping = useCallback((payload: { conversationId: string }) => {
        if (props.state.activeConversation?.id == payload.conversationId) {
            setTyping(true);
        }
    }, [props.state.activeConversation?.id]);

    const handleStopTyping = useCallback((payload: { conversationId: string }) => {
        if (props.state.activeConversation?.id == payload.conversationId) {
            setTyping(false);
        }
    }, [props.state.activeConversation?.id]);

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
                    lastMessage = `${props.state.activeConversation.display_name} sent an attachment`;
                }
            }

            const newConversations = props.state.conversations.map(
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
                                props.state.activeConversation?.id == msg.conversation_id
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
            if (props.state.activeConversation?.id == msg.conversation_id) {
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

            props.dispatch({
                type: MessagingActions.RECEIVE_MESSAGE,
                payload: {
                    newMessages,
                    newConversations
                }
            });
        },
        [props.state.activeConversation, props.state.conversations, atBottom, socket, user?.id]
    );

    useEffect(() => {
        if (socket) {
            socket.on("message", handleMessageReceived);
            socket.on("typing", handleTyping);
            socket.on("stopTyping", handleStopTyping);
        }

        return () => {
            socket.off("message", handleMessageReceived);
            socket.off("typing", handleTyping);
            socket.off("stopTyping", handleStopTyping);
        };
    }, [socket, handleMessageReceived, handleTyping, handleStopTyping]);

    useEffect(() => {
        if (atBottom) {
            setNewMessagesAlert(false);
        }
    }, [atBottom, setNewMessagesAlert]);

    useEffect(() => {
        setFirstItemIndex(START_INDEX);
        setPage(0);
        pageRef.current = 0;
        setReachedStartOfMessages(false);

        if (messageBoxRef && messageBoxRef.current) {
            messageBoxRef.current.innerHTML = "";
            setSendingAllowed(false);
            setCharsLeft(messageCharLimit);
            setAttachments([]);
            setPreviewImages([]);
        }

        // if we can't find the query string in our conversations, we just load the normal messages page
        if (!router.query?.conversationId?.[0]) {
            props.dispatch({
                type: MessagingActions.CHANGE_CONVERSATION,
                payload: {
                    activeConversation: null,
                    queryConversationId: null
                }
            });
            setActiveConversationId("");
            return;
        }

        getMessages(router.query.conversationId[0]).then((_messages) => {
            if (_messages.length < 50) {
                setReachedStartOfMessages(true);
            }

            props.dispatch({
                type: MessagingActions.FETCH_MESSAGES,
                payload: {
                    messages: _messages,
                }
            });
        });
    }, [router.query?.conversationId]);

    return (
        <div
            className={`${styles.conversation} ${
                props.state.isConversationActive ? styles.conversationMobile : ""
            }`}
        >
            <div className={styles.user}>
                <div className={styles.backButton} onClick={handleClickBack}>
                    <ArrowLeft size="30" />
                </div>
                {props.state.activeConversation?.username ? (
                    <>
                        <Link href={`/u/${props.state.activeConversation?.username}`}>
                            <a>
                                <p className="text-bold text-medium">
                                    {props.state.activeConversation?.display_name}
                                </p>
                                <p className={styles.username}>
                                    @{props.state.activeConversation?.username}
                                </p>
                            </a>
                        </Link>
                    </>
                ) : (
                    <p className="text-bold text-large">Deleted Account</p>
                )}
            </div>
            <div
                ref={messagesAreaContainerRef}
                className={styles.messagesAreaContainer}
            >
                <Virtuoso
                    ref={virtuosoRef}
                    key={props.state.activeConversation?.id}
                    className={styles.messagesArea}
                    totalCount={props.state.messages.length}
                    initialTopMostItemIndex={
                        props.state.messages.length > 0
                            ? props.state.messages.length - 1
                            : 0
                    }
                    overscan={10}
                    data={props.state.messages}
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
                                                You have reached the beginning
                                                of this conversation
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="py-3">
                                            <Loading height="50" width="50" />
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
                                    messageId={message.id}
                                    messageAuthorId={message.author_id}
                                    receiverId={
                                        props.state.activeConversation?.receiver_id
                                    }
                                    sender={user.id == message.author_id}
                                    sentTime={message.sent_time}
                                    attachment={message.attachment.url}
                                    conversationId={
                                        props.state.activeConversation?.id
                                    }
                                    setImageModal={props.setImageModal}
                                    setModalAttachment={props.setModalAttachment}
                                    parentContainerRef={
                                        messagesAreaContainerRef
                                    }
                                >
                                    {message.content}
                                </Message>
                            ) : (
                                <DeletedMessage
                                    key={index}
                                    sender={user.id == message.author_id}
                                    sentTime={message.sent_time}
                                    conversationId={
                                        props.state.activeConversation?.id
                                    }
                                />
                            )}
                        </>
                    )}
                ></Virtuoso>
                {newMessagesAlert && (
                    <div
                        className={styles.newMessagesAlert}
                        onClick={handleNewMessagesAlertClick}
                    >
                        New Message(s)
                    </div>
                )}
            </div>
            {typing && (
                <div className={styles.typing}>
                    {props.state.activeConversation.display_name} is typing...
                </div>
            )}
            <MessageBox
                state={props.state}
                sendingAllowed={sendingAllowed}
                setSendingAllowed={setSendingAllowed}
                nowSending={nowSending}
                setNowSending={setNowSending}
                charsLeft={charsLeft}
                setCharsLeft={setCharsLeft}
                messageBoxRef={messageBoxRef}
                attachments={attachments}
                setAttachments={setAttachments}
                previewImages={previewImages}
                setPreviewImages={setPreviewImages}
            />
        </div>
    );
}
