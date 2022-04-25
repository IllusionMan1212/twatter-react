import { memo, ReactElement } from "react";
import styles from "./statusBarLoggedIn.module.scss";
import { Bell } from "phosphor-react";
import Link from "next/link";

interface NotificationButtonProps {
    unreadNotifications: number;
}

const NotificationsButton = memo(function NotificationsButton({
    unreadNotifications,
}: NotificationButtonProps): ReactElement {
    return (
        <Link href="/notifications">
            <a>
                <div className={styles.notifs}>
                    <Bell className={styles.icon} size="25" weight="fill" />
                    {unreadNotifications != 0 && (
                        <div className={styles.unreadBubble}>
                            {unreadNotifications > 99
                                ? "99+"
                                : unreadNotifications}
                        </div>
                    )}
                </div>
            </a>
        </Link>
    );
});

export default NotificationsButton;
