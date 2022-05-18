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
import { MessagingActions } from "src/actions/messagingActions";
import styles from "./activeConversation.module.scss";
import { ActiveConversationProps } from "src/types/props";
import { IAttachment, IMessage, ISocketMessage } from "src/types/general";
import axiosInstance from "src/axios";
import { AxiosResponse } from "axios";
import { useToastContext } from "src/contexts/toastContext";
import { messageCharLimit } from "src/utils/variables";
import { useGlobalContext } from "src/contexts/globalContext";

export default function ActiveConversation({ dispatch, state, atBottom, setNewMessagesAlert,  ...props }: ActiveConversationProps): ReactElement {
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
    const [typing, setTyping] = useState(false);
    const [charsLeft, setCharsLeft] = useState(messageCharLimit);
    const [sendingAllowed, setSendingAllowed] = useState(false);
    const [attachments, setAttachments] = useState<IAttachment[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>(null);

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
            index: state.messages.length - 1,
            behavior: "smooth",
        });
    }, [state.messages.length]);

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
    }, []);

    const loadMoreMessages = useCallback(() => {
        if (reachedStartOfMessages) {
            return;
        }

        setPage(pageRef.current + 1);
        getMessages(state.activeConversation.id).then((newMessages) => {
            if (!newMessages.length) {
                setReachedStartOfMessages(true);
                return;
            }
            const messagesToPrepend = newMessages.length;
            const nextFirstItemIndex = firstItemIndex - messagesToPrepend;

            setFirstItemIndex(nextFirstItemIndex);

            dispatch({
                type: MessagingActions.LOAD_MORE_MESSAGES,
                payload: {
                    newMessages: newMessages,
                },
            });
            return;
        });
    }, [pageRef, firstItemIndex, state.activeConversation?.id, getMessages, dispatch, reachedStartOfMessages]);

    const handleTyping = useCallback((payload: { conversationId: string }) => {
        clearTimeout(timeoutId);
        setTimeoutId(null);
        if (state.activeConversation?.id == payload.conversationId) {
            setTyping(true);
        }

        setTimeoutId(
            setTimeout(() => {
                setTyping(false);
            }, 4000)
        );
    }, [state.activeConversation?.id, setTyping, setTimeoutId, timeoutId]);

    const handleMessageReceived = useCallback(
        (msg: ISocketMessage) => {
            if (user.id == msg.receiver_id) {
                clearTimeout(timeoutId);
                setTimeoutId(null);
                setTyping(false);
            }
        }, [setTyping, timeoutId, user.id]
    );

    useEffect(() => {
        if (socket) {
            socket.on("message", handleMessageReceived);
            socket.on("typing", handleTyping);
        }

        return () => {
            if (socket) {
                socket.off("message", handleMessageReceived);
                socket.off("typing", handleTyping);
            }
        };
    }, [socket, handleMessageReceived, handleTyping]);

    useEffect(() => {
        if (atBottom) {
            setNewMessagesAlert(false);
        }
    }, [atBottom, setNewMessagesAlert]);

    useEffect(() => {
        if (state.isModalActive) {
            dispatch({
                type: MessagingActions.TOGGLE_MODAL,
                payload: {
                    modalAttachment: ""
                }
            });
            return;
        }

        setReachedStartOfMessages(false);
        setFirstItemIndex(START_INDEX);
        setPage(0);
        pageRef.current = 0;

        if (messageBoxRef && messageBoxRef.current) {
            messageBoxRef.current.innerHTML = "";
            setSendingAllowed(false);
            setCharsLeft(messageCharLimit);
            setAttachments([]);
            setPreviewImages([]);
        }

        // if we can't find the query string in our conversations, we just load the normal messages page
        if (!router.query?.conversationId?.[0]) {
            setActiveConversationId("");
            dispatch({
                type: MessagingActions.CHANGE_CONVERSATION,
                payload: {
                    activeConversation: null,
                    queryConversationId: null
                }
            });
            return;
        }

        getMessages(router.query.conversationId[0]).then((_messages) => {
            if (_messages.length < 50) {
                setReachedStartOfMessages(true);
            }

            dispatch({
                type: MessagingActions.FETCH_MESSAGES,
                payload: {
                    messages: _messages,
                }
            });
        });
    }, [router.query?.conversationId, setActiveConversationId, dispatch, getMessages, state.isConversationActive]);

    const MessagesHeader = () => {
        return (
            <>
                {reachedStartOfMessages ? (
                    <div className="usernameGrey text-center text-bold py-3">
                        <p>You have reached the beginning of this conversation</p>
                    </div>
                ) : (
                    <div className="py-3">
                        <Loading height="50" width="50" />
                    </div>
                )}
            </>
        );
    };

    return (
        <div
            className={`${styles.conversation} ${
                state.isConversationActive ? styles.conversationMobile : ""
            }`}
        >
            <div className={styles.user}>
                <div className={styles.backButton} onClick={handleClickBack}>
                    <ArrowLeft size="30" />
                </div>
                {state.activeConversation?.username ? (
                    <>
                        <Link href={`/u/${state.activeConversation?.username}`}>
                            <a>
                                <p className="text-bold text-medium">
                                    {state.activeConversation?.display_name}
                                </p>
                                <p className={styles.username}>
                                    @{state.activeConversation?.username}
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
                    key={state.activeConversation?.id}
                    className={styles.messagesArea}
                    totalCount={state.messages.length}
                    initialTopMostItemIndex={
                        state.messages.length > 0
                            ? state.messages.length - 1
                            : 0
                    }
                    overscan={10}
                    data={state.messages}
                    firstItemIndex={firstItemIndex}
                    alignToBottom
                    followOutput
                    atBottomStateChange={(bottom) => {
                        props.setAtBottom(bottom);
                    }}
                    startReached={loadMoreMessages}
                    components={{
                        Header: () => <MessagesHeader />
                    }}
                    itemContent={(index, message) => (
                        <>
                            {!message.deleted ? (
                                <Message
                                    dispatch={dispatch}
                                    key={message.id}
                                    messageId={message.id}
                                    messageAuthorId={message.author_id}
                                    receiverId={
                                        state.activeConversation?.receiver_id
                                    }
                                    sender={user.id == message.author_id}
                                    sentTime={message.sent_time}
                                    attachment={message.attachment.url}
                                    conversationId={
                                        state.activeConversation?.id
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
                                    sender={user.id == message.author_id}
                                    sentTime={message.sent_time}
                                    conversationId={
                                        state.activeConversation?.id
                                    }
                                />
                            )}
                        </>
                    )}
                />
                {props.newMessagesAlert && (
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
                    {state.activeConversation.display_name} is typing...
                </div>
            )}
            <MessageBox
                state={state}
                sendingAllowed={sendingAllowed}
                setSendingAllowed={setSendingAllowed}
                nowSending={props.nowSending}
                setNowSending={props.setNowSending}
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
