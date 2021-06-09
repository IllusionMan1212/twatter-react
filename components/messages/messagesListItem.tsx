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
                {props.receivers[0] ? (
                    <ProfileImage
                        width={45}
                        height={45}
                        src={props.receivers[0].profile_image}
                        hyperlink={`${props.receivers[0].username}`}
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
                    {props.receivers[0]?.display_name ?? "Deleted Account"}
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
