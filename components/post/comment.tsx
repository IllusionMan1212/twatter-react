/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useCallback, useEffect, useState } from "react";
import LikeButton from "../buttons/likeButton";
import PostOptionsMenuButton from "../buttons/postOptionsMenuButton";
import CommentButton from "../buttons/commentButton";
import Router from "next/router";
import Link from "next/link";
import { timeSince } from "../../src/utils/functions";
import { IUser } from "src/types/general";
import styles from "./comment.module.scss";
import postStyles from "./post.module.scss";
import { CommentProps } from "src/types/props";
import AttachmentsContainer from "../attachmentsContainer";
import { LikePayload } from "src/types/utils";
import ProfileImage from "./profileImage";

export default function Comment(props: CommentProps): ReactElement {
    const [likes, setLikes] = useState<number>(props.comment.likes);

    const handleCommentButtonClickOnComment = (
        commentId: string,
        commentAuthor: IUser
    ) => {
        Router.push(`/u/${commentAuthor.username}/${commentId}`);
    };

    const handleLike = useCallback(
        (payload: LikePayload) => {
            const newLikes = [...likes];
            if (payload.postId == props.comment.id) {
                if (payload.likeType == "LIKE") {
                    setLikes(newLikes.concat(props.currentUser?.id));
                } else if (payload.likeType == "UNLIKE") {
                    setLikes(newLikes.filter((user) => user != props.currentUser?.id));
                }
            }
        },
        [likes]
    );

    useEffect(() => {
        /*
        if (socket?.connected) {
            socket.on("likeToClient", handleLike);
        }

        return () => {
            if (socket?.connected) {
                socket.off("likeToClient", handleLike);
            }
        };
        */
    }, [handleLike]);

    return (
        <div
            className={`${styles.comment} pointer`}
            onClick={() =>
                Router.push(
                    `/u/${props.comment.author.username}/${props.comment.id}`
                )
            }
        >
            <div className={styles.commentUser}>
                <ProfileImage
                    width={30}
                    height={30}
                    src={props.comment.author.avatar_url}
                    hyperlink={props.comment.author.username}
                />
                <div
                    className={`text-bold justify-content-center mr-auto underline ${postStyles.user}`}
                >
                    <Link href={`/u/${props.comment.author.username}`}>
                        <a onClick={(e) => e.stopPropagation()}>
                            <p>{props.comment.author.display_name}</p>
                        </a>
                    </Link>
                </div>
                <PostOptionsMenuButton
                    postId={props.comment.id}
                    postAuthorId={props.comment.author?.id}
                    postAuthorUsername={props.comment.author?.username}
                    currentUserId={props.currentUser?.id}
                    parentContainerRef={props.parentContainerRef}
                ></PostOptionsMenuButton>
            </div>
            <div className={` ${styles.commentText}`}>
                <p>{props.comment.content}</p>
            </div>
            <AttachmentsContainer
                post={props.comment}
                handleMediaClick={props.handleMediaClick}
            ></AttachmentsContainer>
            <div className={postStyles.footer}>
                <div
                    className={`flex align-items-end text-small ${styles.commentDate}`}
                >
                    {timeSince(props.comment.created_at.Time.toString())}
                </div>
                <div className="flex gap-1 justify-content-end">
                    <CommentButton
                        post={props.comment}
                        handleClick={() =>
                            handleCommentButtonClickOnComment(
                                props.comment.id,
                                props.comment.author
                            )
                        }
                    ></CommentButton>
                    <LikeButton
                        post={props.comment}
                        currentUserId={props.currentUser?.id}
                        likes={likes}
                    ></LikeButton>
                </div>
            </div>
        </div>
    );
}
