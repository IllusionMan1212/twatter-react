import styles from "./statusBarLoggedIn.module.scss";
import Search from "components/search";
import { ArrowLeft } from "phosphor-react";
import UserContextMenu from "components/userContextMenu/userContextMenu";
import { ReactElement, useState, useEffect } from "react";
import ProfileImage from "components/post/profileImage";
import { useGlobalContext } from "src/contexts/globalContext";
import Link from "next/link";
import { useUserContext } from "src/contexts/userContext";
import MessagesButton from "components/statusBar/messagesButton";
import NotificationsButton from "components/statusBar/notificationsButton";

interface StatusBarLoggedInProps {
    title: string;
    backButton?: boolean;
}

export default function StatusBarLoggedIn(props: StatusBarLoggedInProps): ReactElement {
    const { unreadConversations } = useGlobalContext();
    const { user } = useUserContext();

    const [userMenu, setUserMenu] = useState(false);
    const [unreadNotifications] = useState(0);
    const [windowWidth, setWindowWidth] = useState(window?.innerWidth);

    const handleClickBack = () => {
        history.back();
    };

    const handleResize = () => {
        setWindowWidth(window.innerWidth);
    };

    useEffect(() => {
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div
            className={`flex text-white align-items-center ${styles.statusBar}`}
        >
            {props.backButton && (
                <div
                    className={styles.backButton}
                    onClick={handleClickBack}
                >
                    <ArrowLeft size="30"/>
                </div>
            )}
            <div
                className={`flex align-items-center ${styles.title}`}
            >
                {windowWidth > 800 ? (
                    <Link href="/home">
                        <a>
                            <p className="text-bold ellipsis">Twatter</p>
                        </a>
                    </Link>
                ): (
                    <p className="text-bold ellipsis">{props.title}</p>
                )}
            </div>
            <div className={styles.search}>
                <Search/>
            </div>
            <div className={`ml-auto flex align-items-center ${styles.messagesAndNotifs}`}>
                <MessagesButton unreadMessages={unreadConversations.length} />
                <NotificationsButton unreadNotifications={unreadNotifications} />
                <div
                    className={`align-items-center ${styles.user}`}
                    onClick={() => {
                        setUserMenu(!userMenu);
                    }}
                >
                    <ProfileImage
                        width={38}
                        height={38}
                        src={user.avatar_url}
                        alt={user.username}
                    />
                    <UserContextMenu
                        open={userMenu}
                        setUserMenu={setUserMenu}
                    />
                </div>
            </div>
        </div>
    );
}
