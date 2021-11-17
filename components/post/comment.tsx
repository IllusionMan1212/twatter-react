/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import LikeButton from "components/buttons/likeButton";
import PostOptionsMenuButton from "components/buttons/postOptionsMenuButton";
import CommentButton from "components/buttons/commentButton";
import Router from "next/router";
import Link from "next/link";
import { timeSince } from "src/utils/functions";
import { IUser } from "src/types/general";
import styles from "./comment.module.scss";
import postStyles from "./post.module.scss";
import { CommentProps } from "src/types/props";
import AttachmentsContainer from "../attachmentsContainer";
import ProfileImage from "./profileImage";
import DateTime from "components/datetime";

export default function Comment(props: CommentProps): ReactElement {
    const handleCommentButtonClickOnComment = (
        commentId: string,
        commentAuthor: IUser
    ) => {
        Router.push(`/u/${commentAuthor.username}/${commentId}`);
    };

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
                <DateTime
                    datetime={props.comment.created_at}
                    formattingFunction={timeSince}
                    className={`flex align-items-end text-small ${styles.commentDate}`}
                />
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
                        likes={props.comment.likes}
                        liked={props.comment.liked}
                    ></LikeButton>
                </div>
            </div>
        </div>
    );
}
