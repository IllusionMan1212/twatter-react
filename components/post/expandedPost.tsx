/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useEffect, useRef, useState } from "react";
import { ExpandedPostProps } from "../../src/types/props";
import styles from "./expandedPost.module.scss";
import postStyles from "./post.module.scss";
import Link from "next/link";
import { formatDate } from "../../src/utils/functions";
import LikeButton from "../buttons/likeButton";
import PostOptionsMenuButton from "../buttons/postOptionsMenuButton";
import { ArrowArcLeft, ImageSquare, PaperPlane, X } from "phosphor-react";
import messagesStyles from "../../styles/messages.module.scss";
import { useToastContext } from "../../src/contexts/toastContext";
import { socket } from "src/hooks/useSocket";
import mediaModalStyles from "../mediaModal/mediaModal.module.scss";
import { IAttachment, IPost } from "src/types/general";
import {
    handleChange,
    handleInput,
    handleKeyDown,
    handlePaste,
    handlePreviewImageClose,
    handleTextInput,
} from "src/utils/eventHandlers";
import { postCharLimit } from "src/utils/variables";
import CommentButton from "../buttons/commentButton";
import Comment from "./comment";
import AttachmentsContainer from "components/attachmentsContainer";
import ProfileImage from "./profileImage";

export default function ExpandedPost(props: ExpandedPostProps): ReactElement {
    const toast = useToastContext();

    const commentBoxRef = useRef<HTMLSpanElement>(null);
    const parentContainerRef = useRef<HTMLDivElement>(null);

    const [commentingAllowed, setCommentingAllowed] = useState(false);
    const [attachments, setAttachments] = useState<Array<IAttachment>>([]);
    const [previewImages, setPreviewImages] = useState<Array<string>>([]);
    const [charsLeft, setCharsLeft] = useState(postCharLimit);

    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
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
        props.setNowCommenting(true);
        const content = commentBoxRef?.current?.innerText
            .replace(/(\n){2,}/g, "\n\n")
            .trim();
        const payload = {
            content: content,
            contentLength: commentBoxRef?.current?.textContent.length,
            author: props.currentUser,
            attachments: attachments,
            replyingTo: props.post._id,
        };
        commentBoxRef.current.textContent = "";
        setAttachments([]);
        setPreviewImages([]);
        setCommentingAllowed(false);
        setCharsLeft(postCharLimit);
        socket.emit("commentToServer", payload);
    };

    const handleCommentButtonClick = () => {
        commentBoxRef?.current?.focus();
    };

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
                                                props.post.replyingTo[0].author
                                                    .profile_image ==
                                                "default_profile.svg"
                                                    ? "/"
                                                    : ""
                                            }${
                                                props.post.replyingTo[0].author
                                                    .profile_image
                                            }`}
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
                    <ProfileImage
                        width={50}
                        height={50}
                        src={props.post.author.profile_image}
                        hyperlink={props.post.author.username}
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
                        postId={props.post._id}
                        postAuthorId={props.post.author._id}
                        currentUserId={props.currentUser?._id}
                        callback={props.callback}
                    ></PostOptionsMenuButton>
                    <div
                        className={`ml-1 mt-1 ${postStyles.postText} ${styles.expandedPostText}`}
                    >
                        <p>{props.post.content}</p>
                        <AttachmentsContainer
                            post={props.post as unknown as IPost}
                            handleMediaClick={props.handleMediaClick}
                        ></AttachmentsContainer>
                    </div>
                </div>
                <div className={styles.postFooter}>
                    <div
                        className={`flex align-items-end text-small ${postStyles.postDate}`}
                    >
                        {formatDate(props.post.createdAt)}
                    </div>
                    <div className="flex gap-1">
                        <CommentButton
                            post={props.post as unknown as IPost}
                            numberOfComments={props.post.comments.length}
                            handleClick={handleCommentButtonClick}
                        ></CommentButton>
                        <LikeButton
                            post={props.post as unknown as IPost}
                            currentUserId={props.currentUser?._id}
                            likeUsers={props.post.likeUsers}
                        ></LikeButton>
                    </div>
                </div>
            </div>
            <div ref={parentContainerRef} className={styles.commentsSection}>
                {props.post.comments.map((comment) => {
                    return (
                        <Comment
                            key={comment._id}
                            comment={comment}
                            currentUser={props.currentUser}
                            handleMediaClick={props.handleMediaClick}
                            parentContainerRef={parentContainerRef}
                        ></Comment>
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
                    <div
                        className={`${styles.progressBar} ${
                            props.nowCommenting ? styles.progressBarInProgress : ""
                        }`}
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
                                <ImageSquare
                                    size="30"
                                    color="white"
                                />
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
