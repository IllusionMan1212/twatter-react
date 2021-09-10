/* eslint-disable react/react-in-jsx-scope */
import styles from "./message.module.scss";
import { MessageProps } from "src/types/props";
import { ReactElement, useEffect, useState } from "react";
import { formatMessageTime } from "src/utils/functions";

export default function Message(props: MessageProps): ReactElement {
    const [sentTime, setSentTime] = useState(props.sentTime);

    const handleClick = () => {
        window.history.pushState(null, null, `${props.conversationId}/media`);
        props.setImageModal(true);
        props.setModalAttachment(props.attachment);
    };

    useEffect(() => {
        setSentTime(formatMessageTime(props.sentTime));
    }, [props.sentTime])

    return (
        <div className={styles.messageContainer}>
            <div
                className={`${
                    props.sender ? styles.senderMessage : styles.recipientMessage
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
