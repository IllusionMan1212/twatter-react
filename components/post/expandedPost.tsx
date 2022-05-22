import { ReactElement, useRef } from "react";
import { ExpandedPostProps } from "src/types/props";
import styles from "./expandedPost.module.scss";
import postStyles from "./post.module.scss";
import Link from "next/link";
import { formatDate } from "src/utils/functions";
import LikeButton from "components/buttons/likeButton";
import PostOptionsMenuButton from "components/buttons/postOptionsMenuButton";
import CommentButton from "components/buttons/commentButton";
import Comment from "./comment";
import AttachmentsContainer from "components/attachmentsContainer";
import ProfileImage from "./profileImage";
import { useUserContext } from "src/contexts/userContext";
import Loading from "components/loading";
import ReplyingTo from "./replyingTo";
import CommentBox from "components/commentBox/commentBox";
import DateTime from "components/datetime";

export default function ExpandedPost(props: ExpandedPostProps): ReactElement {
    const { user } = useUserContext();

    const parentContainerRef = useRef<HTMLDivElement>(null);

    const handleCommentButtonClick = () => {
        // TODO:
    };

    return (
        <>
            <div className={`mx-auto ${styles.expandedPost}`}>
                <div className={styles.expandedPostContent}>
                    <ReplyingTo
                        avatar_size={30}
                        post={props.post}
                    />
                    <ProfileImage
                        width={50}
                        height={50}
                        src={props.post.author.avatar_url}
                        hyperlink={props.post.author.username}
                        alt={props.post.author.username}
                    />
                    <div className={styles.user}>
                        <Link href={`/u/${props.post.author.username}`}>
                            <a
                                className="mr-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="ml-1 flex flex-column justify-content-center">
                                    <p
                                        className={`underline ${styles.displayName}`}
                                    >
                                        {props.post.author.display_name}
                                    </p>
                                    <p className={styles.username}>
                                        @{props.post.author.username}
                                    </p>
                                </div>
                            </a>
                        </Link>
                    </div>
                    <PostOptionsMenuButton
                        postId={props.post.id}
                        postAuthorId={props.post.author.id}
                        postAuthorUsername={props.post.author.username}
                        deleteCallback={props.callback}
                    />
                    <div
                        className={`mt-1 ${postStyles.postText} ${styles.expandedPostText}`}
                    >
                        <p>{props.post.content}</p>
                        <AttachmentsContainer
                            post={props.post}
                            handleMediaClick={props.handleMediaClick}
                        />
                    </div>
                </div>
                <div className={styles.postFooter}>
                    <DateTime
                        datetime={props.post.created_at}
                        formattingFunction={formatDate}
                        className={`flex align-items-end text-small ${postStyles.postDate}`}
                    />
                    <div className="flex gap-1">
                        <CommentButton
                            post={props.post}
                            handleClick={handleCommentButtonClick}
                        />
                        <LikeButton
                            post={props.post}
                            likes={props.post.likes}
                            liked={props.post.liked}
                        />
                    </div>
                </div>
            </div>
            <div ref={parentContainerRef} className={styles.commentsSection}>
                {props.loadingComments ? (
                    <Loading width="50" height="50" />
                ) : (
                    props.comments.map((comment) => (
                        <Comment
                            key={comment.id}
                            comment={comment}
                            handleMediaClick={props.handleMediaClick}
                            parentContainerRef={parentContainerRef}
                        />
                    ))
                )}
            </div>
            {user && (
                <CommentBox postId={props.post.id} />
            )}
        </>
    );
}
