import { ReactElement } from "react";
import { FriendsProps } from "src/types/props";
import styles from "./friends.module.scss";
import Friend from "components/friends/friend";
import { useUserContext } from "src/contexts/userContext";

export default function Friends(props: FriendsProps): ReactElement {
    const { user } = useUserContext();

    if (!user) return null;

    return (
        <div>
            <p className={styles.header}>Friends</p>
            <p className={styles.onlineCount}>Online ({props.count})</p>
            <div className={styles.friends}>
                {new Array(7).fill(null).map((_, i) => {
                    return (
                        <Friend
                            key={i}
                            username={user.username}
                            displayName={user.display_name}
                            avatarURL={user.avatar_url}
                        />
                    );
                })}
            </div>
        </div>
    );
}
