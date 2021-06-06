/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useCallback, useEffect, useState } from "react";
import LikeButton from "../buttons/likeButton";
import PostOptionsMenuButton from "../buttons/postOptionsMenuButton";
import CommentButton from "../buttons/commentButton";
import Router from "next/router";
import Link from "next/link";
import { timeSince } from "../../src/utils/functions";
import { IUser } from "src/types/general";
import styles from "./mediaModalComment.module.scss";
import postStyles from "../post/post.module.scss";
import { ModalCommentProps } from "src/types/props";
import AttachmentsContainer from "components/attachmentsContainer";
import { socket } from "src/hooks/useSocket";
import { LikePayload } from "src/types/utils";
import ProfileImage from "components/post/profileImage";

export default function MediaModalComment(props: ModalCommentProps): ReactElement {
    const [likes, setLikes] = useState<Array<string>>(props.comment.likeUsers);

    const handleCommentButtonClickOnComment = (
        commentId: string,
        commentAuthor: IUser
    ) => {
        Router.push(`/u/${commentAuthor.username}/${commentId}`);
    };

    const handleLike = useCallback(
        (payload: LikePayload) => {
            if (payload.postId == props.comment._id) {
                if (payload.likeType == "LIKE") {
                    setLikes(likes.concat(props.currentUser?._id));
                } else if (payload.likeType == "UNLIKE") {
                    setLikes(likes.filter((user) => user != props.currentUser?._id));
                }
                props.updateModalCommentLikes(payload);
            }
        },
        [likes]
    );

    useEffect(() => {
        if (socket?.connected) {
            socket.on("likeToClient", handleLike);
        }

        return () => {
            if (socket?.connected) {
                socket.off("likeToClient", handleLike);
            }
        };
    }, [handleLike]);

    return (
        <div
            className={`${styles.comment} pointer`}
            onClick={() =>
                Router.push(
                    `/u/${props.comment.author.username}/${props.comment._id}`
                )
            }
        >
            <div className="flex">
                <div className={`mr-auto underline ${styles.commentUser}`}>
                    <ProfileImage
                        width={30}
                        height={30}
                        src={props.comment.author.profile_image}
                        hyperlink={props.comment.author.username}
                    />
                    <div
                        className={`text-bold justify-content-center ${postStyles.user}`}
                    >
                        <Link href={`/u/${props.comment.author.username}`}>
                            <a onClick={(e) => e.stopPropagation()}>
                                <p>{props.comment.author.display_name}</p>
                            </a>
                        </Link>
                    </div>
                </div>
                <PostOptionsMenuButton
                    postId={props.comment._id}
                    postAuthorId={props.comment.author?._id}
                    currentUserId={props.currentUser?._id}
                    parentContainerRef={props.parentContainerRef}
                ></PostOptionsMenuButton>
            </div>
            <div className={` ${styles.commentText}`}>
                <p>{props.comment.content}</p>
                <AttachmentsContainer
                    post={props.comment}
                    handleMediaClick={props.handleMediaClick}
                ></AttachmentsContainer>
            </div>
            <div className={postStyles.footer}>
                <div
                    className={`flex align-items-end text-small ${styles.commentDate}`}
                >
                    {timeSince(props.comment.createdAt)}
                </div>
                <div className="flex gap-1 justify-content-end">
                    <CommentButton
                        post={props.comment}
                        numberOfComments={props.comment.comments.length}
                        handleClick={() =>
                            handleCommentButtonClickOnComment(
                                props.comment._id,
                                props.comment.author
                            )
                        }
                    ></CommentButton>
                    <LikeButton
                        post={props.comment}
                        currentUserId={props.currentUser?._id}
                        likeUsers={likes}
                    ></LikeButton>
                </div>
            </div>
        </div>
    );
}
