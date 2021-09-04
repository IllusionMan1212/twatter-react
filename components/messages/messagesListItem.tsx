/* eslint-disable react/react-in-jsx-scope */
import styles from "./messagesListItem.module.scss";
import { MessageListItemProps } from "../../src/types/props";
import { ReactElement } from "react";
import ProfileImage from "components/post/profileImage";
import { timeSince } from "src/utils/functions";

export default function MessagesListItem(
    props: MessageListItemProps
): ReactElement {
    return (
        <div
            className={`${styles.listItem} ${props.isActive && styles.active}`}
            style={props.unreadMessages != 0 ? { backgroundColor: "#242C37" } : null}
            onClick={props.onClick}
        >
            <div className={styles.profilePicutre}>
                {props.receiver ? (
                    <ProfileImage
                        width={45}
                        height={45}
                        src={props.receiver.avatar_url}
                        hyperlink={`${props.receiver.username}`}
                    />
                ) : (
                    <ProfileImage
                        width={45}
                        height={45}
                        src="/default_profile.svg"
                    />
                )}    
            </div>
            <div className={styles.text}>
                <p className="text-medium text-bold">
                    {props.receiver?.display_name ?? "Deleted Account"}
                </p>
                <div>
                    <p
                        className={`mt-3Percent ${styles.lastMessage} ${
                            props.isActive && styles.lastMessageActive
                        }`}
                    >
                        {props.lastMessage}
                    </p>
                </div>
            </div>
            <div className={styles.date}>
                <p>{timeSince(props.lastUpdated)}</p>
            </div>
            <div>
                {props.unreadMessages != 0 && (
                    <div className={styles.unreadMessages}>{props.unreadMessages}</div>
                )}
            </div>
        </div>
    );
}
