/* eslint-disable react/react-in-jsx-scope */
import styles from "./post.module.scss";
import Link from "next/link";
import { ReactElement } from "react";
import { formatBigNumbers, timeSince } from "../../src/utils/functions";
import LikeButton from "../buttons/likeButton";
import { PostProps } from "../../src/types/props";
import PostOptionsMenuButton from "../buttons/postOptionsMenuButton";
import Router from "next/router";
import CommentButton from "../buttons/commentButton";
import { ChatCircle } from "phosphor-react";

export default function Post(props: PostProps): ReactElement {
    const handleCommentButtonClick = () => {
        console.log("TODO:comment button click");
    };

    const handleCommentButtonClickMobile = () => {
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
                {props.post.author ? (
                    <Link
                        href={`/u/${props.post.author.display_name.toLowerCase()}`}
                    >
                        <a
                            className="flex"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                className="pointer profileImage"
                                src={`${
                                    props.post.author.profile_image ==
                                    "default_profile.svg"
                                        ? "/"
                                        : ""
                                }${props.post.author.profile_image}`}
                                width="40"
                                height="40"
                            />
                        </a>
                    </Link>
                ) : (
                    <img
                        className="pointer profileImage"
                        src="/default_profile.svg"
                        width="40"
                        height="40"
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
                <div className={styles.user}>
                    {props.post.author ? (
                        <Link
                            href={`/u/${props.post.author.display_name.toLowerCase()}`}
                        >
                            <a onClick={(e) => e.stopPropagation()}>
                                <div className="text-bold flex flex-column justify-content-center">
                                    <p className="ml-1">
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
                <div className={`ml-1 ${styles.postText}`}>
                    <p>{props.post.content}</p>
                    {props.post.attachments?.length ? (
                        <div className={`my-1 ${styles.imagesContainer}`}>
                            {props.post.attachments.length == 2 ? (
                                <>
                                    <div className={styles.halfImageGrid}>
                                        <div
                                            className={`max-w-100 ${styles.imageAttachment} ${styles.halfImageGrid2Images}`}
                                            style={{
                                                backgroundImage: `url('${props.post.attachments[0]}')`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (props.post.author) {
                                                    window.history.pushState(
                                                        null,
                                                        null,
                                                        `/u/${props.post.author.username}/${props.post._id}/media`
                                                    );
                                                    props.handleMediaClick(
                                                        e,
                                                        props.post,
                                                        0
                                                    );
                                                }
                                            }}
                                        ></div>
                                    </div>
                                    <div className={styles.halfImageGrid}>
                                        <div
                                            className={`max-w-100 ${styles.imageAttachment} ${styles.halfImageGrid2Images}`}
                                            style={{
                                                backgroundImage: `url('${props.post.attachments[1]}')`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (props.post.author) {
                                                    window.history.pushState(
                                                        null,
                                                        null,
                                                        `/u/${props.post.author.username}/${props.post._id}/media`
                                                    );
                                                    props.handleMediaClick(
                                                        e,
                                                        props.post,
                                                        1
                                                    );
                                                }
                                            }}
                                        ></div>
                                    </div>
                                </>
                            ) : props.post.attachments.length == 3 ? (
                                <>
                                    <div className={styles.halfImageGrid}>
                                        <div
                                            className={`max-w-100 ${styles.imageAttachment}`}
                                            style={{
                                                backgroundImage: `url('${props.post.attachments[0]}')`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (props.post.author) {
                                                    window.history.pushState(
                                                        null,
                                                        null,
                                                        `/u/${props.post.author.username}/${props.post._id}/media`
                                                    );
                                                    props.handleMediaClick(
                                                        e,
                                                        props.post,
                                                        0
                                                    );
                                                }
                                            }}
                                        ></div>
                                    </div>
                                    <div className={styles.halfImageGrid}>
                                        <div
                                            className={`max-w-100 ${styles.imageAttachment}`}
                                            style={{
                                                backgroundImage: `url('${props.post.attachments[1]}')`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (props.post.author) {
                                                    window.history.pushState(
                                                        null,
                                                        null,
                                                        `/u/${props.post.author.username}/${props.post._id}/media`
                                                    );
                                                    props.handleMediaClick(
                                                        e,
                                                        props.post,
                                                        1
                                                    );
                                                }
                                            }}
                                        ></div>
                                        <div
                                            className={`max-w-100 ${styles.imageAttachment}`}
                                            style={{
                                                backgroundImage: `url('${props.post.attachments[2]}')`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (props.post.author) {
                                                    window.history.pushState(
                                                        null,
                                                        null,
                                                        `/u/${props.post.author.username}/${props.post._id}/media`
                                                    );
                                                    props.handleMediaClick(
                                                        e,
                                                        props.post,
                                                        2
                                                    );
                                                }
                                            }}
                                        ></div>
                                    </div>
                                </>
                            ) : props.post.attachments.length == 4 ? (
                                <>
                                    <div className={styles.halfImageGrid}>
                                        <div
                                            className={`max-w-100 ${styles.imageAttachment}`}
                                            style={{
                                                backgroundImage: `url('${props.post.attachments[0]}')`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (props.post.author) {
                                                    window.history.pushState(
                                                        null,
                                                        null,
                                                        `/u/${props.post.author.username}/${props.post._id}/media`
                                                    );
                                                    props.handleMediaClick(
                                                        e,
                                                        props.post,
                                                        0
                                                    );
                                                }
                                            }}
                                        ></div>
                                        <div
                                            className={`max-w-100 ${styles.imageAttachment}`}
                                            style={{
                                                backgroundImage: `url('${props.post.attachments[2]}')`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (props.post.author) {
                                                    window.history.pushState(
                                                        null,
                                                        null,
                                                        `/u/${props.post.author.username}/${props.post._id}/media`
                                                    );
                                                    props.handleMediaClick(
                                                        e,
                                                        props.post,
                                                        2
                                                    );
                                                }
                                            }}
                                        ></div>
                                    </div>
                                    <div className={styles.halfImageGrid}>
                                        <div
                                            className={`max-w-100 ${styles.imageAttachment}`}
                                            style={{
                                                backgroundImage: `url('${props.post.attachments[1]}')`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (props.post.author) {
                                                    window.history.pushState(
                                                        null,
                                                        null,
                                                        `/u/${props.post.author.username}/${props.post._id}/media`
                                                    );
                                                    props.handleMediaClick(
                                                        e,
                                                        props.post,
                                                        1
                                                    );
                                                }
                                            }}
                                        ></div>
                                        <div
                                            className={`max-w-100 ${styles.imageAttachment}`}
                                            style={{
                                                backgroundImage: `url('${props.post.attachments[3]}')`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (props.post.author) {
                                                    window.history.pushState(
                                                        null,
                                                        null,
                                                        `/u/${props.post.author.username}/${props.post._id}/media`
                                                    );
                                                    props.handleMediaClick(
                                                        e,
                                                        props.post,
                                                        3
                                                    );
                                                }
                                            }}
                                        ></div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.halfImageGrid}>
                                    <div
                                        className={`max-w-100 ${styles.imageAttachment}`}
                                        style={{
                                            backgroundImage: `url('${props.post.attachments[0]}')`,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (props.post.author) {
                                                window.history.pushState(
                                                    null,
                                                    null,
                                                    `/u/${props.post.author.username}/${props.post._id}/media`
                                                );
                                                props.handleMediaClick(
                                                    e,
                                                    props.post,
                                                    0
                                                );
                                            }
                                        }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
                <div className={styles.footer}>
                    <div
                        className={`flex align-items-end text-small ${styles.postDate}`}
                    >
                        {timeSince(props.post.createdAt)}
                    </div>
                    <div className="flex gap-1 justify-content-end">
                        <div className={styles.commentButtonMobile}>
                            <CommentButton
                                post={props.post}
                                numberOfComments={props.post.numberOfComments}
                                handleClick={handleCommentButtonClickMobile}
                            ></CommentButton>
                        </div>
                        <LikeButton
                            post={props.post}
                            currentUserId={props.currentUser?._id}
                        ></LikeButton>
                    </div>
                </div>
                <PostOptionsMenuButton
                    postId={props.post._id}
                    postAuthorId={props.post.author?._id}
                    currentUserId={props.currentUser?._id}
                ></PostOptionsMenuButton>
            </div>
            <div className={styles.postCommentsPreview}>
                {props.post.attachments?.length
                    ? props.post.comments.length != 0 && (
                        <div className={styles.comments}>
                            {" "}
                            {props.post.comments.map((comment, i) => {
                                return (
                                    <div
                                        className={styles.previewComment}
                                        key={i}
                                    >
                                        {comment.author ? (
                                            <img
                                                className="profileImage"
                                                src={`${
                                                    comment.author
                                                        ?.profile_image ==
                                                      "default_profile.svg"
                                                        ? "/"
                                                        : ""
                                                }${
                                                    comment.author
                                                        ?.profile_image
                                                }`}
                                                width="30"
                                                height="30"
                                            />
                                        ) : (
                                            <img
                                                className="profileImage"
                                                src="/default_profile.svg"
                                                width="30"
                                                height="30"
                                            />
                                        )}
                                        <div className="text-bold text-small flex flex-column justify-content-center">
                                            <p className="ml-1">
                                                {comment.author
                                                    ?.display_name ??
                                                      "Deleted Account"}
                                            </p>
                                        </div>
                                        <div
                                            className={`text-small ${styles.postText}`}
                                        >
                                            <p className="ml-1">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                    : props.post.comments.length != 0 && (
                        <div className={styles.comments}>
                            <div className={styles.previewComment}>
                                {props.post.comments[0].author ? (
                                    <img
                                        className="profileImage"
                                        src={`${
                                            props.post.comments[0].author
                                                ?.profile_image ==
                                              "default_profile.svg"
                                                ? "/"
                                                : ""
                                        }${
                                            props.post.comments[0].author
                                                ?.profile_image
                                        }`}
                                        width="30"
                                        height="30"
                                    />
                                ) : (
                                    <img
                                        className="profileImage"
                                        src="/default_profile.svg"
                                        width="30"
                                        height="30"
                                    />
                                )}
                                <div className="text-bold text-small flex flex-column justify-content-center">
                                    <p className="ml-1">
                                        {props.post.comments[0].author
                                            ?.display_name ??
                                              "Deleted Account"}
                                    </p>
                                </div>
                                <div
                                    className={`text-small ${styles.postText}`}
                                >
                                    <p className="ml-1">
                                        {props.post.comments[0].content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                {!props.post.comments.length && (
                    <div
                        className={`text-small ${styles.postText} usernameGrey`}
                    >
                        <p className="ml-1">This post has no comments</p>
                    </div>
                )}
                {props.post.comments.length != 0 && (
                    <Link
                        href={`/u/${props.post.author.username}/${props.post._id}`}
                    >
                        <a>
                            <p
                                className={`text-small text-bold usernameGrey ${styles.viewCommentsText}`}
                            >
                                View all{" "}
                                {formatBigNumbers(props.post.numberOfComments)}{" "}
                                comment(s)
                            </p>
                        </a>
                    </Link>
                )}
                <div
                    className={styles.commentButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCommentButtonClick();
                    }}
                >
                    <ChatCircle size="30"></ChatCircle>
                </div>
            </div>
        </div>
    );
}
