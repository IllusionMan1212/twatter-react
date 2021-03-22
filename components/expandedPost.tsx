/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { ExpandedPostProps } from "../src/types/props";
import styles from "./expandedPost.module.scss";
import postStyles from "./post.module.scss";
import Link from "next/link";
import { formatDate, timeSince } from "../src/utils/functions";
import LikeButton from "./likeButton";
import PostOptionsMenuButton from "./postOptionsMenuButton";
import { ArrowArcLeft, ImageSquare, PaperPlane, X } from "phosphor-react";
import messagesStyles from "../styles/messages.module.scss";
import { useToastContext } from "../src/contexts/toastContext";
import { connectSocket, socket } from "../src/socket";
import mediaModalStyles from "./mediaModal.module.scss";
import { Attachment } from "src/types/general";
import {
    handleChange,
    handleInput,
    handleKeyDown,
    handlePaste,
    handlePreviewImageClose,
    handleTextInput,
} from "src/utils/eventHandlers";
import { postCharLimit } from "src/utils/variables";
import CommentButton from "./commentButton";
import Router from "next/router";

export default function ExpandedPost(props: ExpandedPostProps): ReactElement {
    const toast = useToastContext();

    const commentBoxRef = useRef<HTMLSpanElement>(null);

    const [commentingAllowed, setCommentingAllowed] = useState(false);
    const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const [previewImages, setPreviewImages] = useState<Array<string>>([]);
    const [charsLeft, setCharsLeft] = useState(postCharLimit);
    const [nowCommenting, setNowCommenting] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        console.log(nowCommenting);
        if (!commentingAllowed) {
            e.preventDefault();
            return;
        }
        if (commentBoxRef?.current?.textContent.trim().length > postCharLimit) {
            e.preventDefault();
            return;
        }
        if (
            commentBoxRef?.current?.textContent.length == 0 &&
            attachments.length == 0
        ) {
            e.preventDefault();
            return;
        }
        setNowCommenting(true);
        const content = commentBoxRef?.current?.innerText
            .replace(/(\n){2,}/g, "\n\n")
            .trim();
        const payload = {
            content: content,
            author: props.currentUser,
            attachments: attachments,
            replyingTo: props.post._id,
        };
        commentBoxRef.current.textContent = "";
        setAttachments([]);
        setPreviewImages([]);
        setCommentingAllowed(false);
        setCharsLeft(postCharLimit);
        if (socket) {
            socket?.emit("commentToServer", payload);
        } else {
            console.log("socket not connected, trying to connect");
            connectSocket(props.currentUser.token);
            socket?.emit("commentToServer", payload);
        }
    };

    const handleCommentButtonClick = () => {
        commentBoxRef?.current?.focus();
    };

    const handleCommentButtonClickOnComment = (commentId: string) => {
        Router.push(`/u/${props.post.author.username}/${commentId}`);
    };

    const handleComment = useCallback(
        (payload) => {
            toast("Commented Successfully", 3000);
            setNowCommenting(false);

            props.post.comments.unshift(payload);
        },
        [props.post]
    );

    useEffect(() => {
        socket?.on("commentToClient", handleComment);

        return () => {
            socket?.off("commentToClient", handleComment);
        };
    }, [socket, handleComment]);

    useEffect(() => {
        commentBoxRef?.current?.addEventListener(
            "textInput",
            handleTextInput as never
        );

        return () => {
            commentBoxRef?.current?.removeEventListener(
                "textInput",
                handleTextInput as never
            );
        };
    });

    return (
        <>
            <div className={`mx-auto ${styles.expandedPost}`}>
                <div className={styles.expandedPostContent}>
                    {props.post.replyingTo[0] && (
                        <Link
                            href={`/u/${props.post.replyingTo[0].author.username}/${props.post.replyingTo[0]._id}`}
                        >
                            <a
                                className={`flex mb-1Percent text-small ${styles.replyingTo}`}
                            >
                                <div className="flex">
                                    <ArrowArcLeft size={25}></ArrowArcLeft>
                                    <div className="flex align-items-center">
                                        <span className="px-1">
                                            Replying to:{" "}
                                        </span>
                                        <img
                                            className="round"
                                            src={`${
                                                props.post.replyingTo[0].author.profile_image ==
                                                "default_profile.svg"
                                                    ? "/"
                                                    : ""
                                            }${props.post.replyingTo[0].author.profile_image}`}
                                            width={25}
                                            height={25}
                                        ></img>{" "}
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
                    <Link href={`/u/${props.post.author.username}`}>
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
                                alt="User profile picture"
                            />
                        </a>
                    </Link>
                    <div className={styles.user}>
                        <Link href={`/u/${props.post.author.username}`}>
                            <a onClick={(e) => e.stopPropagation()}>
                                <div className="text-bold flex flex-column justify-content-center">
                                    <p className="ml-1">
                                        {props.post.author.display_name}
                                    </p>
                                </div>
                            </a>
                        </Link>
                    </div>
                    <div
                        className={`ml-1 ${postStyles.postText} ${styles.expandedPostText}`}
                    >
                        <p>{props.post.content}</p>
                        {props.post.attachments.length ? (
                            <div
                                className={`my-1 ${postStyles.imagesContainer}`}
                            >
                                {props.post.attachments.length == 2 ? (
                                    <>
                                        <div
                                            className={postStyles.halfImageGrid}
                                        >
                                            <div
                                                className={`max-w-100 ${postStyles.imageAttachment} ${postStyles.halfImageGrid2Images}`}
                                                style={{
                                                    backgroundImage: `url('${props.post.attachments[0]}')`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                                }}
                                            ></div>
                                        </div>
                                        <div
                                            className={postStyles.halfImageGrid}
                                        >
                                            <div
                                                className={`max-w-100 ${postStyles.imageAttachment} ${postStyles.halfImageGrid2Images}`}
                                                style={{
                                                    backgroundImage: `url('${props.post.attachments[1]}')`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                                }}
                                            ></div>
                                        </div>
                                    </>
                                ) : props.post.attachments.length == 3 ? (
                                    <>
                                        <div
                                            className={postStyles.halfImageGrid}
                                        >
                                            <div
                                                className={`max-w-100 ${postStyles.imageAttachment}`}
                                                style={{
                                                    backgroundImage: `url('${props.post.attachments[0]}')`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                                }}
                                            ></div>
                                        </div>
                                        <div
                                            className={postStyles.halfImageGrid}
                                        >
                                            <div
                                                className={`max-w-100 ${postStyles.imageAttachment}`}
                                                style={{
                                                    backgroundImage: `url('${props.post.attachments[1]}')`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                                }}
                                            ></div>
                                            <div
                                                className={`max-w-100 ${postStyles.imageAttachment}`}
                                                style={{
                                                    backgroundImage: `url('${props.post.attachments[2]}')`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                                }}
                                            ></div>
                                        </div>
                                    </>
                                ) : props.post.attachments.length == 4 ? (
                                    <>
                                        <div
                                            className={postStyles.halfImageGrid}
                                        >
                                            <div
                                                className={`max-w-100 ${postStyles.imageAttachment}`}
                                                style={{
                                                    backgroundImage: `url('${props.post.attachments[0]}')`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                                }}
                                            ></div>
                                            <div
                                                className={`max-w-100 ${postStyles.imageAttachment}`}
                                                style={{
                                                    backgroundImage: `url('${props.post.attachments[1]}')`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                                }}
                                            ></div>
                                        </div>
                                        <div
                                            className={postStyles.halfImageGrid}
                                        >
                                            <div
                                                className={`max-w-100 ${postStyles.imageAttachment}`}
                                                style={{
                                                    backgroundImage: `url('${props.post.attachments[2]}')`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                                }}
                                            ></div>
                                            <div
                                                className={`max-w-100 ${postStyles.imageAttachment}`}
                                                style={{
                                                    backgroundImage: `url('${props.post.attachments[3]}')`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
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
                                                }}
                                            ></div>
                                        </div>
                                    </>
                                ) : (
                                    <div className={postStyles.halfImageGrid}>
                                        <div
                                            className={`max-w-100 ${postStyles.imageAttachment}`}
                                            style={{
                                                padding: "0",
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
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
                                            }}
                                        >
                                            <img
                                                src={`${props.post.attachments[0]}`}
                                                width="100%"
                                                height="100%"
                                                alt="Post's attached image"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                    <PostOptionsMenuButton
                        postId={props.post._id}
                        postAuthorId={props.post.author._id}
                        currentUserId={props.currentUser?._id}
                        callback={props.callback}
                    ></PostOptionsMenuButton>
                </div>
                <div className={styles.postFooter}>
                    <div
                        className={`flex align-items-end text-small ${postStyles.postDate}`}
                    >
                        {formatDate(props.post.createdAt)}
                    </div>
                    <div className="flex gap-1">
                        <CommentButton
                            post={props.post}
                            handleClick={handleCommentButtonClick}
                        ></CommentButton>
                        <LikeButton
                            post={props.post}
                            currentUserId={props.currentUser?._id}
                        ></LikeButton>
                    </div>
                </div>
            </div>
            <div className={styles.commentsSection}>
                {props.post.comments.map((comment, i) => {
                    return (
                        <div className={styles.comment} key={i}>
                            <div className={styles.commentUser}>
                                <Link href={`/u/${comment.author.username}`}>
                                    <a>
                                        <img
                                            className="profileImage"
                                            src={`${
                                                comment.author.profile_image ==
                                                "default_profile.svg"
                                                    ? "/"
                                                    : ""
                                            }${comment.author.profile_image}`}
                                            width="30"
                                            height="30"
                                            alt="User profile picture"
                                        />
                                    </a>
                                </Link>
                                <div
                                    className={`text-bold justify-content-center ${postStyles.user}`}
                                >
                                    <Link
                                        href={`/u/${comment.author.username}`}
                                    >
                                        <a>
                                            <p>{comment.author.display_name}</p>
                                        </a>
                                    </Link>
                                </div>
                            </div>
                            <div className={` ${styles.postText}`}>
                                <p>{comment.content}</p>
                            </div>
                            <div className={postStyles.footer}>
                                <div
                                    className={`flex align-items-end text-small ${styles.commentDate}`}
                                >
                                    {timeSince(comment.createdAt)}
                                </div>
                                <div className="flex gap-1 justify-content-end">
                                    <CommentButton
                                        post={comment}
                                        handleClick={() =>
                                            handleCommentButtonClickOnComment(
                                                comment._id
                                            )
                                        }
                                    ></CommentButton>
                                    <LikeButton
                                        post={comment}
                                        currentUserId={props.currentUser?._id}
                                    ></LikeButton>
                                </div>
                            </div>
                            <PostOptionsMenuButton
                                postId={comment._id}
                                postAuthorId={comment.author?._id}
                                currentUserId={props.currentUser?._id}
                            ></PostOptionsMenuButton>
                        </div>
                    );
                })}
            </div>
            {props.currentUser && (
                <div className={`${styles.inputContainer}`}>
                    <div
                        className={`${messagesStyles.charLimit} ${
                            charsLeft < 0 ? messagesStyles.charLimitReached : ""
                        }`}
                        style={{
                            width: `${
                                ((postCharLimit - charsLeft) * 100) /
                                postCharLimit
                            }%`,
                        }}
                    ></div>
                    {attachments.length != 0 && (
                        <div
                            className={mediaModalStyles.previewImagesContainer}
                        >
                            {previewImages.map((previewImage, i) => {
                                return (
                                    <div
                                        key={i}
                                        className={
                                            mediaModalStyles.previewImage
                                        }
                                        style={{
                                            backgroundImage: `url(${previewImage})`,
                                        }}
                                    >
                                        <div
                                            className={
                                                messagesStyles.previewImageClose
                                            }
                                            onClick={(e) =>
                                                handlePreviewImageClose(
                                                    e,
                                                    i,
                                                    previewImages,
                                                    setPreviewImages,
                                                    attachments,
                                                    setAttachments,
                                                    commentBoxRef,
                                                    setCommentingAllowed
                                                )
                                            }
                                        >
                                            <X weight="bold"></X>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className={`${messagesStyles.messageInputArea}`}>
                        <span
                            ref={commentBoxRef}
                            className={messagesStyles.messageInput}
                            contentEditable="true"
                            data-placeholder="Comment on this..."
                            onInput={(e) =>
                                handleInput(
                                    e,
                                    postCharLimit,
                                    attachments,
                                    setCommentingAllowed,
                                    setCharsLeft
                                )
                            }
                            onPaste={(e) =>
                                handlePaste(
                                    e,
                                    postCharLimit,
                                    charsLeft,
                                    setCharsLeft,
                                    setCommentingAllowed,
                                    previewImages,
                                    setPreviewImages,
                                    attachments,
                                    setAttachments,
                                    toast
                                )
                            }
                            onKeyDown={(e) =>
                                handleKeyDown(e, commentBoxRef, handleClick)
                            }
                        ></span>
                        <div
                            className={`flex ${messagesStyles.messageInputOptions}`}
                        >
                            <div
                                className={`${messagesStyles.sendMessageButton}`}
                            >
                                <ImageSquare size="30"></ImageSquare>
                                <input
                                    className={messagesStyles.fileInput}
                                    onChange={(e) =>
                                        handleChange(
                                            e,
                                            attachments,
                                            setAttachments,
                                            previewImages,
                                            setPreviewImages,
                                            setCommentingAllowed,
                                            toast
                                        )
                                    }
                                    onClick={(e) => {
                                        e.currentTarget.value = null;
                                    }}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    multiple
                                />
                            </div>
                            <button
                                className={messagesStyles.button}
                                disabled={commentingAllowed ? false : true}
                                onClick={handleClick}
                            >
                                <PaperPlane
                                    size="30"
                                    color="#6067fe"
                                    opacity={commentingAllowed ? "1" : "0.3"}
                                ></PaperPlane>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
