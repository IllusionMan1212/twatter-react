/* eslint-disable react/react-in-jsx-scope */
import styles from "./message.module.scss";
import { MessageProps } from "src/types/props";
import { ReactElement } from "react";
import { formatMessageTime } from "src/utils/functions";
import MessageOptionsMenuButton from "components/messages/messageOptionsMenuButton";
import DateTime from "components/datetime";
import { MessagingActions } from "src/actions/messagingActions";

export default function Message({ dispatch, ...props }: MessageProps): ReactElement {
    const handleClick = () => {
        window.history.pushState(null, null, `${props.conversationId}/media`);
        dispatch({
            type: MessagingActions.TOGGLE_MODAL,
            payload: {
                modalAttachment: props.attachment
            }
        });
    };

    return (
        <div className={styles.messageContainer}>
            <div
                className={`${
                    props.sender ? styles.senderMessage : styles.recipientMessage
                }`}
            >
                <div className="flex flex-column">
                    <div
                        className={`${
                            props.sender ? styles.senderMessageBlock : styles.recipientMessageBlock
                        }`}
                    >
                        {props.children && (
                            <div className={styles.content}>{props.children}</div>
                        )}
                    </div>
                    {props.attachment && (
                        <div
                            className={styles.attachment}
                            style={{ backgroundImage: `url(${props.attachment})` }}
                            onClick={handleClick}
                        />
                    )}
                </div>
                {props.sender && (
                    <MessageOptionsMenuButton
                        className={styles.optionsButton}
                        parentContainerRef={props.parentContainerRef}
                        messageId={props.messageId}
                        messageAuthorId={props.messageAuthorId}
                        receiverId={props.receiverId}
                        conversationId={props.conversationId}
                    />
                )}
            </div>
            <DateTime
                datetime={props.sentTime}
                formattingFunction={formatMessageTime}
                className={props.sender ? styles.senderTime : styles.recipientTime}
            />
        </div>
    );
}
