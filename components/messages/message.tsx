/* eslint-disable react/react-in-jsx-scope */
import styles from "./message.module.scss";
import { MessageProps } from "src/types/props";
import { ReactElement, useState } from "react";
import { formatMessageTime } from "src/utils/functions";
import MessageOptionsMenuButton from "components/messages/messageOptionsMenuButton";

export default function Message(props: MessageProps): ReactElement {
    const [sentTime, _] = useState(formatMessageTime(props.sentTime));

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
                <div
                    className={`${
                        props.sender ? styles.senderMessageBlock : styles.recipientMessageBlock
                    }`}
                >
                    {props.children && (
                        <div className={styles.content}>{props.children}</div>
                    )}
                    {props.attachment && (
                        <img
                            className={styles.attachment}
                            src={props.attachment}
                            height="auto"
                            width="auto"
                            onClick={handleClick}
                            alt="Message's attached image"
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
