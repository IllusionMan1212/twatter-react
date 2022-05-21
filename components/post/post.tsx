import styles from "./post.module.scss";
import Link from "next/link";
import { memo, ReactElement } from "react";
import { timeSince } from "src/utils/functions";
import LikeButton from "components/buttons/likeButton";
import { PostProps } from "src/types/props";
import PostOptionsMenuButton from "components/buttons/postOptionsMenuButton";
import Router from "next/router";
import CommentButton from "components/buttons/commentButton";
import AttachmentsContainer from "components/attachmentsContainer";
import ProfileImage from "./profileImage";
import ReplyingTo from "./replyingTo";
import DateTime from "components/datetime";
import { useUserContext } from "src/contexts/userContext";

const Post = memo(function Post(props: PostProps): ReactElement {
    const { user } = useUserContext();

    const handleCommentButtonClick = () => {
        // TODO: open a modal where you can comment on the post
        Router.push(`/u/${props.post.author.username}/${props.post.id}`);
    };

    return (
        <div
            className={`mx-auto pointer ${styles.post}`}
            onClick={() =>
                Router.push(
                    `/u/${props.post.author.username}/${props.post.id}`
                )
            }
        >
            <div className={styles.postContent}>
                <ReplyingTo
                    post={props.post}
                    avatar_size={25}
                />
                <ProfileImage
                    width={40}
                    height={40}
                    hyperlink={props.post.author.username}
                    src={props.post.author.avatar_url}
                    alt={props.post.author.username}
                />
                <div className={styles.user}>
                    <Link
                        href={`/u/${props.post.author.username}`}
                    >
                        <a onClick={(e) => e.stopPropagation()}>
                            <div className="text-bold flex flex-column justify-content-center">
                                <p className="ml-1 underline">
                                    {props.post.author.display_name}
                                </p>
                            </div>
                        </a>
                    </Link>
                </div>
                <PostOptionsMenuButton
                    postId={props.post.id}
                    postAuthorId={props.post.author?.id}
                    postAuthorUsername={props.post.author?.username}
                    currentUserId={user?.id}
                    parentContainerRef={props.parentContainerRef}
                />
                <div className={`ml-1 ${styles.postText}`}>
                    <p>{props.post.content}</p>
                    <AttachmentsContainer
                        post={props.post}
                        handleMediaClick={props.handleMediaClick}
                    />
                </div>
                <div className={styles.footer}>
                    <DateTime
                        datetime={props.post.created_at}
                        formattingFunction={timeSince}
                        className={`flex align-items-end text-small ${styles.postDate}`}
                    />
                    <div className="flex gap-1 justify-content-end">
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
        </div>
    );
});

export default Post;
