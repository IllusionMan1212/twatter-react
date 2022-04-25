import { memo, ReactElement } from "react";
import styles from "./statusBarLoggedIn.module.scss";
import { ChatsTeardrop } from "phosphor-react";
import Link from "next/link";

interface MessagesButtonProps {
    unreadMessages: number;
}

const MessagesButton = memo(function MessagesButton({
    unreadMessages,
}: MessagesButtonProps): ReactElement {
    return (
        <Link href="/messages">
            <a>
                <div className={styles.messages}>
                    <ChatsTeardrop
                        className={styles.icon}
                        size="25"
                        weight="fill"
                    />
                    {unreadMessages != 0 && (
                        <div className={styles.unreadBubble}>
                            {unreadMessages > 99 ? "99+" : unreadMessages}
                        </div>
                    )}
                </div>
            </a>
        </Link>
    );
});

export default MessagesButton;
