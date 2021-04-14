/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import { FollowButtonProps } from "src/types/props";
import styles from "./followButton.module.scss";
import { useToastContext } from "src/contexts/toastContext";

export default function FollowButton(props: FollowButtonProps): ReactElement {
    const toast = useToastContext();

    const handleClick = () => {
        toast("Coming Soon™", 3000);
    };

    return (
        <div
            className={styles.followButton}
            style={{ padding: `${props.size}px ${props.size * 2}px`, fontSize: props.size * 1.5 }}
            onClick={handleClick}
        >
            Follow
        </div>
    );
}
