/* eslint-disable react/react-in-jsx-scope */
import styles from "./message.module.scss";
import { MessageProps } from "../../src/types/props";
import { ReactElement } from "react";
import { formatMessgeTime } from "../../src/utils/functions";

export default function Message({
    sender,
    children,
    sentTime,
    attachment,
    conversationId,
    setImageModal,
    setModalAttachment,
}: MessageProps): ReactElement {

    const handleClick = () => {
        window.history.pushState(null, null, `${conversationId}/media`);
        setImageModal(true);
        setModalAttachment(attachment);
    };

    return (
        <div className={styles.messageContainer}>
            <div
                className={`${
                    sender ? styles.senderMessage : styles.recipientMessage
                }`}
            >
                {children && (
                    <div className={styles.content}>{children}</div>
                )}
                {attachment && (
                    <img
                        className={styles.attachment}
                        src={attachment}
                        height="auto"
                        width="auto"
                        onClick={handleClick}
                        alt="Message's attached image"
                    />
                )}
            </div>
            <div
                className={`${
                    sender ? styles.senderTime : styles.recipientTime
                }`}
            >
                {formatMessgeTime(sentTime)}
            </div>
        </div>
    );
}
