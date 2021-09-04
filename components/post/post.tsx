/* eslint-disable react/react-in-jsx-scope */
import styles from "./post.module.scss";
import Link from "next/link";
import { ReactElement } from "react";
import { timeSince } from "../../src/utils/functions";
import LikeButton from "../buttons/likeButton";
import { PostProps } from "../../src/types/props";
import PostOptionsMenuButton from "../buttons/postOptionsMenuButton";
import Router from "next/router";
import CommentButton from "../buttons/commentButton";
import { ArrowArcLeft } from "phosphor-react";
import AttachmentsContainer from "../attachmentsContainer";
import ProfileImage from "./profileImage";

export default function Post(props: PostProps): ReactElement {
    const handleCommentButtonClick = () => {
        // TODO: open a modal where you can comment on the post
        Router.push(`/u/${props.post.author.username}/${props.post.id}`);
    };

    return (
        <div
            className={`mx-auto pointer ${styles.post}`}
            onClick={() =>
                props.post.author &&
                Router.push(
                    `/u/${props.post.author.username}/${props.post.id}`
                )
            }
        >
            <div className={styles.postContent}>
                {props.post.replying_to?.id.Valid && (
                    <Link
                        href={`/u/${props.post.replying_to.author.username.String}/${props.post.replying_to.id.Int64}`}
                    >
                        <a
                            className={`flex mb-1Percent text-small ${styles.replyingTo}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex">
                                <ArrowArcLeft size={25}></ArrowArcLeft>
                                <div className="flex align-items-center">
                                    <span className="px-1">
                                        Replying to:
                                    </span>
                                    <ProfileImage
                                        width={25}
                                        height={25}
                                        src={props.post.replying_to.author.avatar_url.String}
                                    />
                                    <span
                                        className="text-bold"
                                        style={{ paddingLeft: "0.5em" }}
                                    >
                                        {
                                            props.post.replying_to.author
                                                .display_name.String
                                        }
                                        {"'s post: "}
                                    </span>
                                    {props.post.replying_to.content.Valid && (
                                        <span
                                            style={{ paddingLeft: "0.5em" }}
                                        >
                                            &quot;
                                            {
                                                props.post.replying_to
                                                    .content.String
                                            }
                                            &quot;
                                        </span>
                                    )}
                                </div>
                            </div>
                        </a>
                    </Link>
                )}
                {props.post.author ? (
                    <ProfileImage
                        width={40}
                        height={40}
                        hyperlink={props.post.author.username}
                        src={props.post.author.avatar_url}
                    />
                ) : (
                    <ProfileImage
                        width={40}
                        height={40}
                        src="/default_profile.svg"
                    />
                )}
                <div className={styles.user}>
                    {props.post.author ? (
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
                    ) : (
                        <div
                            className="text-bold flex flex-column justify-content-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <p className="ml-1">Deleted Account</p>
                        </div>
                    )}
                </div>
                <PostOptionsMenuButton
                    postId={props.post.id}
                    postAuthorId={props.post.author?.id}
                    postAuthorUsername={props.post.author?.username}
                    currentUserId={props.currentUser?.id}
                    parentContainerRef={props.parentContainerRef}
                ></PostOptionsMenuButton>
                <div className={`ml-1 ${styles.postText}`}>
                    <p>{props.post.content}</p>
                    <AttachmentsContainer
                        post={props.post}
                        handleMediaClick={props.handleMediaClick}
                    ></AttachmentsContainer>
                </div>
                <div className={styles.footer}>
                    <div
                        className={`flex align-items-end text-small ${styles.postDate}`}
                    >
                        {timeSince(props.post.created_at)}
                    </div>
                    <div className="flex gap-1 justify-content-end">
                        <CommentButton
                            post={props.post}
                            handleClick={handleCommentButtonClick}
                        ></CommentButton>
                        <LikeButton
                            post={props.post}
                            currentUserId={props.currentUser?.id}
                            likes={props.post.likes}
                            liked={props.post.liked}
                        ></LikeButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
