/* eslint-disable react/react-in-jsx-scope */
import styles from "./likeButton.module.scss";
import { ReactElement, useRef, useState } from "react";
import { useToastContext } from "../src/contexts/toastContext";
import axios from "../src/axios";
import { LikeButtonProps } from "../src/types/props";
import { formatBigNumbers } from "../src/utils/functions";

export default function LikeButton(props: LikeButtonProps): ReactElement {
    const [likes, setLikes] = useState(props.post.likeUsers.length);
    const [liked, setLiked] = useState(
        props.post.likeUsers.includes(props.currentUserId)
    );

    const likeRef = useRef(null);

    const toast = useToastContext();

    const handleClick = () => {
        if (!props.currentUserId) {
            toast("You must be logged in to like this post", 4000);
            return;
        }
        if (!liked) {
            likeRef.current.classList.add(styles.isAnimating);
            setTimeout(() => {
                likeRef.current.classList.remove(styles.isAnimating);
            }, 800);
        }
        const payload = {
            postId: props.post._id,
            likeOrUnlike: liked ? "unlike" : "like",
        };
        liked ? setLikes(likes - 1) : setLikes(likes + 1);
        setLiked(!liked);
        axios.post("posts/likePost", payload).catch((err) => {
            liked ? setLikes(likes) : setLikes(likes);
            setLiked(liked);
            toast(err?.response?.data?.message ?? "An error has occurred", 3000);
            // this makes sure the frontend cancels the update if the request failed.
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
                        style={{ backgroundPosition: liked ? "right" : "left" }}
                    ></div>
                </div>
            </div>
            {likes != 0 && <p>{formatBigNumbers(likes)}</p>}
        </div>
    );
}
