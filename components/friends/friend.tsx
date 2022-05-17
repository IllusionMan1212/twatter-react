import { memo, ReactElement } from "react";
import styles from "./friend.module.scss";
import ProfileImage from "components/post/profileImage";
import Link from "next/link";
import { FriendProps } from "src/types/props";

const Friend = memo(function Friend(props: FriendProps): ReactElement {
    return (
        <Link href={`/u/${props.username}`}>
            <a>
                <div className={styles.container}>
                    <ProfileImage
                        width={38}
                        height={38}
                        src={props.avatarURL}
                        onlineIndicator
                        alt={props.username}
                    />
                    <p className="text-bold">{props.displayName}</p>
                </div>
            </a>
        </Link>
    );
});

export default Friend;
