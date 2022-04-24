import { ReactElement } from "react";
import styles from "./statusBarLoggedIn.module.scss";
import Router from "next/router";
import { ChatsTeardrop } from "phosphor-react";

interface Props {
    unreadMessages: number;
}

export default function MessagesButton({ unreadMessages }: Props): ReactElement {
    return (
        <div
            className={styles.messages}
            onClick={() => {
                Router.push("/messages", null, {
                    shallow: true,
                });
            }}
        >
            <ChatsTeardrop
                className={styles.icon}
                size="25"
                weight="fill"
            ></ChatsTeardrop>
            {unreadMessages != 0 && (
                <div className={styles.unreadBubble}>
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                </div>
            )}
        </div>
    );
}

