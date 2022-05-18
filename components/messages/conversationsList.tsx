import { ReactElement, useCallback, useEffect, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import Loading from "components/loading";
import ConversationsListItem from "components/messages/conversationsListItem";
import { IConversation } from "src/types/general";
import { MessagingActions } from "src/actions/messagingActions";
import { useUserContext } from "src/contexts/userContext";
import { useRouter } from "next/router";
import { ConversationsListProps } from "src/types/props";
import { AxiosResponse } from "axios";
import { useToastContext } from "src/contexts/toastContext";
import axiosInstance from "src/axios";
import useLatestState from "src/hooks/useLatestState";

export default function ConversationsList(props: ConversationsListProps): ReactElement {
    const { user, socket } = useUserContext();
    const toast = useToastContext();

    const router = useRouter();

    const [reachedEndOfConvos, setReachedEndOfConvos] = useState(false);
    const [conversationsLoading, setConversationsLoading] = useState(true);
    const [conversationsPage, setConversationsPage] = useLatestState(0);

    const getConversations = useCallback((): Promise<IConversation[]> => {
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
                return [];
            });
    }, [conversationsPage]);

    const loadMoreConversations = useCallback(() => {
        if (reachedEndOfConvos) {
            return;
        }

        setConversationsPage(conversationsPage.current + 1);
        getConversations().then((newConversations) => {
            if (!newConversations.length || newConversations.length < 20) {
                setReachedEndOfConvos(true);
                return;
            }

            props.dispatch({
                type: MessagingActions.LOAD_MORE_CONVERSATIONS,
                payload: {
                    newConversations: newConversations,
                }
            });
        });
    }, [conversationsPage, getConversations, setConversationsPage, reachedEndOfConvos]);

    const handleConversationClick = (conversation: IConversation) => {
        if (conversation.id == props.state.activeConversation?.id) {
            return;
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

    useEffect(() => {
        if (user) {
            getConversations().then((_conversations) => {
                if (_conversations.length < 20) {
                    setReachedEndOfConvos(true);
                }

                props.dispatch({
                    type: MessagingActions.FETCH_CONVERSATIONS,
                    payload: {
                        conversations: _conversations,
                    }
                });
                setConversationsLoading(false);
            });
        }
    }, [user]);

    const ConversationFooter = () => {
        return (
            <>
                {!reachedEndOfConvos ? (
                    <div className="py-3">
                        <Loading height="50" width="50" />
                    </div>
                ) : null}
            </>
        );
    };

    if (conversationsLoading) return <Loading width="50" height="50"/>;

    return (
        <>
            {props.state.conversations.length ? (
                <Virtuoso
                    data={props.state.conversations}
                    style={{ width: "100%" }}
                    totalCount={props.state.conversations.length}
                    components={{
                        Footer: () => <ConversationFooter />
                    }}
                    endReached={loadMoreConversations}
                    itemContent={(_, conversation) => {
                        return (
                            <ConversationsListItem
                                key={conversation.id}
                                receiver={conversation.receiver}
                                lastMessage={conversation.last_message.String}
                                lastUpdated={conversation.last_updated}
                                isActive={
                                    conversation.id ==
                                    props.state.activeConversation?.id
                                }
                                unreadMessages={conversation.unread_messages}
                                onClick={() => {
                                    handleConversationClick(conversation);
                                }}
                            />
                        );
                    }}
                />
            ) : (
                <div className="text-bold text-large">
                    It&apos;s empty in here :(
                </div>
            )}
        </>
    );
}
