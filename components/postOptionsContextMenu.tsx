/* eslint-disable react/react-in-jsx-scope */
import styles from "./postOptionsContextMenu.module.scss";
import { Flag, Share, Eraser } from "phosphor-react";
import axios from "../src/axios";
import { useToastContext } from "../src/contexts/toastContext";
import { PostOptionsMenuProps } from "../src/types/props";
import { ReactElement } from "react";
import { socket } from "../src/socket";

export default function PostOptionsMenu(
    props: PostOptionsMenuProps
): ReactElement {
    const toast = useToastContext();

    const handleOnClick = () => {
        if (props.postAuthorId != props.currentUserId) {
            return;
        }
        props.callback?.();
        const payload = {
            postAuthor: props.postAuthorId,
            postId: props.postId,
        };
        const socketPayload = {
            postId: props.postId,
        };
        axios
            .post("posts/deletePost", payload)
            .then((res) => {
                socket?.emit("deletePost", socketPayload);
                toast(res.data.message, 3000);
            })
            .catch((err) => {
                toast(err?.response?.data?.message ?? "An error has occurred", 3000);
            });
    };

    return (
        <>
            <div className={`pointer ${styles.menu}`}>
                <div>
                    <Flag size="20"></Flag>
                    Report Post
                </div>
                <hr />
                <div>
                    <Share size="20"></Share>
                    Share Post
                </div>
                {props.currentUserId &&
                props.postAuthorId == props.currentUserId ? (
                        <>
                            <hr />
                            <div
                                className={styles.deletePostButton}
                                onClick={handleOnClick}
                            >
                                <Eraser size="20"></Eraser>
                            Delete Post
                            </div>
                        </>
                    ) : null}
            </div>
            <div className="outsideClickOverlay"></div>
        </>
    );
}
