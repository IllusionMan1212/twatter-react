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
        Router.push(`/u/${props.post.author.username}/${props.post._id}`);
    };

    return (
        <div
            className={`mx-auto pointer ${styles.post}`}
            onClick={() =>
                props.post.author &&
                Router.push(
                    `/u/${props.post.author.username}/${props.post._id}`
                )
            }
        >
            <div className={styles.postContent}>
                {props.post.replyingTo?.[0] && (
                    <Link
                        href={`/u/${props.post.replyingTo[0].author.username}/${props.post.replyingTo[0]._id}`}
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
                                        src={props.post.replyingTo[0].author.profile_image}
                                    />
                                    <span
                                        className="text-bold"
                                        style={{ paddingLeft: "0.5em" }}
                                    >
                                        {
                                            props.post.replyingTo[0].author
                                                .display_name
                                        }
                                        {"'s post: "}
                                    </span>
                                    {props.post.replyingTo[0].content && (
                                        <span
                                            style={{ paddingLeft: "0.5em" }}
                                        >
                                            &quot;
                                            {
                                                props.post.replyingTo[0]
                                                    .content
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
                        src={props.post.author.profile_image}
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
                    postId={props.post._id}
                    postAuthorId={props.post.author?._id}
                    currentUserId={props.currentUser?._id}
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
                        {timeSince(props.post.createdAt)}
                    </div>
                    <div className="flex gap-1 justify-content-end">
                        <CommentButton
                            post={props.post}
                            numberOfComments={props.post.numberOfComments}
                            handleClick={handleCommentButtonClick}
                        ></CommentButton>
                        <LikeButton
                            post={props.post}
                            currentUserId={props.currentUser?._id}
                            likeUsers={props.post.likeUsers}
                        ></LikeButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
