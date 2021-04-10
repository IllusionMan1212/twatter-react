/* eslint-disable react/react-in-jsx-scope */
import styles from "./likeButton.module.scss";
import { ReactElement, useRef } from "react";
import { useToastContext } from "../../src/contexts/toastContext";
import axios from "../../src/axios";
import { LikeButtonProps } from "../../src/types/props";
import { formatBigNumbers } from "../../src/utils/functions";
import { socket } from "src/hooks/useSocket";
import { LikePayload } from "src/types/utils";

export default function LikeButton(props: LikeButtonProps): ReactElement {
    const likeRef = useRef(null);

    const toast = useToastContext();

    const handleClick = () => {
        if (!props.currentUserId) {
            toast("You must be logged in to like this post", 4000);
            return;
        }
        if (!props.likeUsers.includes(props.currentUserId)) {
            likeRef?.current?.classList.add(styles.isAnimating);
            setTimeout(() => {
                likeRef?.current?.classList.remove(styles.isAnimating);
            }, 800);
        }
        const payload: LikePayload = {
            postId: props.post._id,
            likeType: props.likeUsers.includes(props.currentUserId) ? "UNLIKE" : "LIKE",
        };

        socket.emit("likeToServer", payload);
        axios.post("posts/likePost", payload).catch((err) => {
            toast(err?.response?.data?.message ?? "An error has occurred", 3000);
        });
    };

    return (
        <div
            className={`flex ${styles.likeButton}`}
            onClick={(e) => {
                e.stopPropagation();
                handleClick();
            }}
        >
            <div className={styles.likeContainer}>
                <div className={styles.likeContainerChild}>
                    <div
                        ref={likeRef}
                        className={styles.like}
                        style={{ backgroundPosition: props.likeUsers.includes(props.currentUserId) ? "right" : "left" }}
                    ></div>
                </div>
            </div>
            {props.likeUsers.length != 0 && <p>{formatBigNumbers(props.likeUsers.length)}</p>}
        </div>
    );
}
