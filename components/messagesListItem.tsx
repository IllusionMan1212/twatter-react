/* eslint-disable react/react-in-jsx-scope */
import styles from "./messagesListItem.module.scss";
import { MessageListItemProps } from "../src/types/props";
import { ReactElement } from "react";
import Link from "next/link";

export default function MessagesListItem(
    props: MessageListItemProps
): ReactElement {
    return (
        <div
            className={`${styles.listItem} ${props.isActive && styles.active}`}
            onClick={props.onClick}
        >
            <div className={styles.user}>
                {props.receivers[0] ? (
                    <Link href={`/u/${props.receivers[0].username}`}>
                        <a onClick={(e) => e.stopPropagation()}>
                            <img
                                className="profileImage"
                                src={`${
                                    props.receivers[0].profile_image ==
                                    "default_profile.svg"
                                        ? "/"
                                        : ""
                                }${props.receivers[0].profile_image}`}
                                width="40"
                                height="40"
                                alt="User profile picture"
                            />
                        </a>
                    </Link>
                ) : (
                    <img
                        className="profileImage"
                        src="/default_profile.svg"
                        width="40"
                        height="40"
                        alt="User profile picture"
                    />
                )}
                <p className="text-medium text-bold">
                    {props.receivers[0]?.display_name ?? "Deleted Account"}
                </p>
                {props.unreadMessages != 0 && (
                    <div className={styles.unreadMessages}>{props.unreadMessages}</div>
                )}
            </div>
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
    );
}
