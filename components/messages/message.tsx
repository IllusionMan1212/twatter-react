/* eslint-disable react/react-in-jsx-scope */
import styles from "./message.module.scss";
import { MessageProps } from "src/types/props";
import { ReactElement, useState } from "react";
import { formatMessageTime } from "src/utils/functions";
import MessageOptionsMenuButton from "components/messages/messageOptionsMenuButton";

export default function Message(props: MessageProps): ReactElement {
    const [sentTime] = useState(formatMessageTime(props.sentTime));

    const handleClick = () => {
        window.history.pushState(null, null, `${props.conversationId}/media`);
        props.setImageModal(true);
        props.setModalAttachment(props.attachment);
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
            <div
                className={`${
                    props.sender ? styles.senderTime : styles.recipientTime
                }`}
            >
                {sentTime}
            </div>
        </div>
    );
}
