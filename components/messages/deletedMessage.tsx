/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useState } from "react";
import { DeletedMessageProps } from "src/types/props";
import messageStyles from "components/messages/message.module.scss";
import styles from "./deletedMessage.module.scss";
import { formatMessageTime } from "src/utils/functions";

export default function DeletedMessage(props: DeletedMessageProps): ReactElement {
    const [sentTime, _] = useState(formatMessageTime(props.sentTime));

    return (
        <div className={messageStyles.messageContainer}>
            <div
                className={`${
                    props.sender
                        ? styles.senderMessage
                        : styles.recipientMessage
                }`}
            >
                <div className={messageStyles.content}>
                    <i>This Message Was Deleted</i>
                </div>
            </div>
            <div
                className={`${
                    props.sender
                        ? messageStyles.senderTime
                        : messageStyles.recipientTime
                }`}
            >
                {sentTime}
            </div>
        </div>
    );
}
