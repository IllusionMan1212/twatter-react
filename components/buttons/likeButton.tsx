/* eslint-disable react/react-in-jsx-scope */
import styles from "./likeButton.module.scss";
import { ReactElement, useRef, useState } from "react";
import { useToastContext } from "src/contexts/toastContext";
import axios from "src/axios";
import { LikeButtonProps } from "src/types/props";
import { formatBigNumbers } from "src/utils/functions";
import { LikePayload } from "src/types/utils";
import { useUserContext } from "src/contexts/userContext";

export default function LikeButton(props: LikeButtonProps): ReactElement {
    const likeRef = useRef(null);
    const [canLike, setCanLike] = useState(true);

    const toast = useToastContext();
    const { socket } = useUserContext();

    const handleClick = () => {
        if (!props.currentUserId) {
            toast("You must be logged in to like this post", 4000);
            return;
        }
        if (!canLike) {
            return;
        }
        setCanLike(false);

        if (!props.liked) {
            likeRef?.current?.classList.add(styles.isAnimating);
            setTimeout(() => {
                likeRef?.current?.classList.remove(styles.isAnimating);
            }, 800);
        }

        const payload: LikePayload = {
            postId: props.post.id,
            likeType: props.liked ? "UNLIKE" : "LIKE",
        };

        const socketPayload = {
            eventType: "like",
            data: {
                postId: props.post.id,
                likeType: props.liked ? "UNLIKE" : "LIKE"
            }
        };

        socket.send(JSON.stringify(socketPayload));

        axios.post("posts/likePost", payload)
            .then(() => {
                setCanLike(true);
            })
            .catch((err) => {
                toast(err?.response?.data?.message ?? "An error has occurred", 3000);
                socket.send(JSON.stringify(socketPayload));
                setCanLike(true);
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
                        style={{ backgroundPosition: props.liked ? "right" : "left" }}
                    ></div>
                </div>
            </div>
            {props.likes != 0 && <p>{formatBigNumbers(props.likes)}</p>}
        </div>
    );
}
