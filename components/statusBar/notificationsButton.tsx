import { ReactElement } from "react";
import styles from "./statusBar.module.scss";
import Router from "next/router";
import { Bell } from "phosphor-react";

interface Props {
    unreadNotifications: number;
};

export default function NotificationsButton({ unreadNotifications }: Props): ReactElement {
    return (
        <div className={styles.notifs}>
            <Bell
                className={styles.icon}
                size="25"
                onClick={() => {
                    Router.push("/notifications", null, {
                        shallow: true,
                    });
                }}
                weight="fill"
            ></Bell>
            {unreadNotifications != 0 && (
                <div className={styles.unreadBubble}>
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </div>
            )}
        </div>
    );
}
