import styles from "./conversationsListItem.module.scss";
import { ConversationsListItemProps } from "src/types/props";
import { ReactElement } from "react";
import ProfileImage from "components/post/profileImage";
import { timeSince } from "src/utils/functions";
import DateTime from "components/datetime";

export default function ConversationsListItem(
    props: ConversationsListItemProps
): ReactElement {
    return (
        <div
            className={`${styles.listItem} ${props.isActive && styles.active}`}
            style={props.unreadMessages != 0 ? { backgroundColor: "#242C37" } : null}
            onClick={props.onClick}
        >
            <div>
                {props.receiver ? (
                    <ProfileImage
                        width={45}
                        height={45}
                        src={props.receiver.avatar_url}
                        hyperlink={props.receiver.username}
                        alt={props.receiver.username}
                    />
                ) : (
                    <ProfileImage
                        width={45}
                        height={45}
                        src="/default_profile.svg"
                        alt="Deleted User"
                    />
                )}    
            </div>
            <div className={styles.text}>
                <p className="text-medium text-bold ellipsis">
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
            {props.lastUpdated.Valid && (
                <DateTime
                    datetime={props.lastUpdated.Time.toString()}
                    formattingFunction={timeSince}
                    className={styles.date}
                />
            )}
            <div>
                {props.unreadMessages != 0 && (
                    <div className={styles.unreadMessages}>{props.unreadMessages}</div>
                )}
            </div>
        </div>
    );
}
