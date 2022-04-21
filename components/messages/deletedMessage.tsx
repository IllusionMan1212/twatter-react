/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import { DeletedMessageProps } from "src/types/props";
import messageStyles from "components/messages/message.module.scss";
import styles from "./deletedMessage.module.scss";
import { formatMessageTime } from "src/utils/functions";
import DateTime from "components/datetime";

export default function DeletedMessage(props: DeletedMessageProps): ReactElement {
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
                    <i>Deleted Message</i>
                </div>
            </div>
            <DateTime
                datetime={props.sentTime}
                formattingFunction={formatMessageTime}
                className={props.sender ? messageStyles.senderTime : messageStyles.recipientTime}
            />
        </div>
    );
}
