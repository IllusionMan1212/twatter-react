/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import LikeButton from "../buttons/likeButton";
import PostOptionsMenuButton from "../buttons/postOptionsMenuButton";
import CommentButton from "../buttons/commentButton";
import Router from "next/router";
import Link from "next/link";
import { timeSince } from "../../src/utils/functions";
import { User } from "src/types/general";
import styles from "./comment.module.scss";
import postStyles from "./post.module.scss";
import { CommentProps } from "src/types/props";
import AttachmentsContainer from "../attachmentsContainer";

export default function Comment(props: CommentProps): ReactElement {
    const handleCommentButtonClickOnComment = (
        commentId: string,
        commentAuthor: User
    ) => {
        Router.push(`/u/${commentAuthor.username}/${commentId}`);
    };

    return (
        <div
            className={`${styles.comment} pointer`}
            onClick={() =>
                Router.push(
                    `/u/${props.comment.author.username}/${props.comment._id}`
                )
            }
        >
            <div className={styles.commentUser}>
                <Link href={`/u/${props.comment.author.username}`}>
                    <a onClick={(e) => e.stopPropagation()}>
                        <img
                            className="profileImage"
                            src={`${
                                props.comment.author.profile_image ==
                                "default_profile.svg"
                                    ? "/"
                                    : ""
                            }${props.comment.author.profile_image}`}
                            width="30"
                            height="30"
                            alt="User profile picture"
                        />
                    </a>
                </Link>
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
                    postId={props.comment._id}
                    postAuthorId={props.comment.author?._id}
                    currentUserId={props.currentUser?._id}
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
                    ></LikeButton>
                </div>
            </div>
        </div>
    );
}
