/* eslint-disable react/react-in-jsx-scope */
import {
    X,
    ImageSquare,
    PaperPlane,
    ArrowLeft,
    ArrowRight,
} from "phosphor-react";
import styles from "./mediaModal.module.scss";
import messagesStyles from "../../styles/messages.module.scss";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { formatDate } from "../../src/utils/functions";
import LikeButton from "../buttons/likeButton";
import { MediaModalProps } from "../../src/types/props";
import PostOptionsMenuButton from "../buttons/postOptionsMenuButton";
import { useToastContext } from "../../src/contexts/toastContext";
import SwiperCore, { Navigation } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Loading from "../loading";
import axios from "axios";
import { IAttachment, IPost } from "src/types/general";
import {
    handleAttachmentChange,
    handleInput,
    handleKeyDown,
    handlePaste,
    handlePreviewImageClose,
    handleTextInput,
} from "src/utils/eventHandlers";
import { postCharLimit } from "src/utils/variables";
import MediaModalComment from "./mediaModalComment";
import Link from "next/link";
import CommentButton from "../buttons/commentButton";
import { LikePayload } from "src/types/utils";
import ProfileImage from "../post/profileImage";
import { NavigationMethods } from "swiper/types/components/navigation";
import { useUserContext } from "src/contexts/userContext";

SwiperCore.use([Navigation]);

export default function MediaModal(props: MediaModalProps): ReactElement {
    const toast = useToastContext();
    const { socket } = useUserContext();

    const commentBoxRef = useRef<HTMLSpanElement>(null);
    const prevRef = useRef<HTMLDivElement>(null);
    const nextRef = useRef<HTMLDivElement>(null);
    const parentContainerRef = useRef<HTMLDivElement>(null);

    const [commentingAllowed, setCommentingAllowed] = useState(false);
    const [charsLeft, setCharsLeft] = useState(postCharLimit);
    const [attachments, setAttachments] = useState<Array<IAttachment>>([]);
    const [previewImages, setPreviewImages] = useState<Array<string>>([]);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [comments, setComments] = useState<Array<IPost>>([]);
    const [nowCommenting, setNowCommenting] = useState(false);
    const [postLikes, setPostLikes] = useState(props.modalData.post.likes);
    const [postLiked, setPostLiked] = useState(props.modalData.post.liked);

    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (!commentingAllowed) {
            e.preventDefault();
            return;
        }
        if (commentBoxRef.current.textContent.trim().length > postCharLimit) {
            e.preventDefault();
            return;
        }
        if (
            commentBoxRef.current.textContent.length == 0 &&
            attachments.length == 0
        ) {
            e.preventDefault();
            return;
        }
        setNowCommenting(true);
        const content = commentBoxRef.current.innerText
            .replace(/(\n){2,}/g, "\n\n")
            .trim();
        const payload = {
            eventType: "commentToServer",
            data: {
                content: content,
                contentLength: commentBoxRef.current.textContent.length,
                author: props.modalData.currentUser,
                attachments: attachments,
                replying_to: props.modalData.post.id,
            }
        };
        commentBoxRef.current.textContent = "";
        setAttachments([]);
        setPreviewImages([]);
        setCommentingAllowed(false);
        setCharsLeft(postCharLimit);

        socket.send(JSON.stringify(payload));
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => {
        e.key == "Escape" && window.history.back();
    };

    const handleCommentClick = () => {
        commentBoxRef?.current?.focus();
    };

    const handleComment = useCallback(
        (payload) => {
            setNowCommenting(false);
            setComments([payload].concat(comments));
            toast("Commented Successfully", 2000);
        },
        [comments]
    );

    const handleCommentDelete = useCallback(
        (commentIdObj) => {
            const commentId = commentIdObj.postId;
            setComments(comments.filter((comment) => comment.id != commentId));
        },
        [comments]
    );

    const handleLike = useCallback(
        (payload: LikePayload) => {
            if (payload.postId == props.modalData.post.id) {
                if (payload.likeType == "LIKE") {
                    setPostLikes(likes => likes + 1);
                    setPostLiked(true);
                } else if (payload.likeType == "UNLIKE") {
                    setPostLikes(likes => likes - 1);
                    setPostLiked(false);
                }
            } else {
                setComments((comments) => {
                    return comments.map((comment) => {
                        if (comment.id == payload.postId) {
                            if (payload.likeType == "LIKE") {
                                comment.likes++;
                                comment.liked = true;
                            } else if (payload.likeType == "UNLIKE") {
                                comment.likes--;
                                comment.liked = false;
                            }
                            return comment;
                        }
                        return comment;
                    });
                });    
            }
        },
        [comments]
    );

    useEffect(() => {
        setPostLikes(props.modalData.post.likes);
        setPostLiked(props.modalData.post.liked);
    }, [props.modalData.post.likes, props.modalData.post.liked]);

    useEffect(() => {
        setCommentsLoading(true);
        setComments([]);
        setCommentingAllowed(false);
        setCharsLeft(postCharLimit);
        setAttachments([]);
        setPreviewImages([]);
        setNowCommenting(false);

        const cancelToken = axios.CancelToken;
        const tokenSource = cancelToken.source();

        axios
            .get(
                `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/posts/getComments/${props.modalData.post.id}`,
                { cancelToken: tokenSource.token, withCredentials: true }
            )
            .then((res) => {
                setComments(res.data.comments);
                setCommentsLoading(false);
            })
            .catch((err) => {
                setCommentsLoading(false);
                if (axios.isCancel(err)) {
                    console.log("request canceled");
                } else {
                    err?.response?.data?.status != 404 &&
                        toast(
                            err?.response?.data?.message ??
                                "An error has occurred",
                            4000
                        );
                }
            });

        return () => {
            tokenSource.cancel();
        };
    }, [props.modalData.post.id]);

    useEffect(() => {
        if (socket) {
            socket.on("commentToClient", handleComment);
            socket.on("deletePost", handleCommentDelete);
            socket.on("like", handleLike);
        }

        return () => {
            if (socket) {
                socket.off("commentToClient", handleComment);
                socket.off("deletePost", handleCommentDelete);
                socket.off("like", handleLike);
            }
        };
    }, [handleComment, handleCommentDelete, handleLike]);

    useEffect(() => {
        if (commentBoxRef?.current) {
            commentBoxRef.current.addEventListener(
                "textInput",
                handleTextInput as never
            );
        }

        window?.addEventListener("keydown", handleWindowKeyDown);

        return () => {
            if (commentBoxRef?.current) {
                commentBoxRef.current.removeEventListener(
                    "textInput",
                    handleTextInput as never
                );
            }
            window?.removeEventListener("keydown", handleWindowKeyDown);
        };
    });

    return (
        <div
            className={styles.withMediaModal}
        >
            <div className={`text-white ${styles.modalPost}`}>
                <div className={styles.modalPostContent}>
                    <div className={styles.modalPostUser}>
                        <Link
                            href={`/u/${props.modalData.post.author.username}`}
                        >
                            <a className={`mr-auto ${styles.user}`}>
                                <ProfileImage
                                    width={50}
                                    height={50}
                                    src={props.modalData.post.author.avatar_url}
                                />
                                <div className="flex flex-column">
                                    <p
                                        className={`underline ${styles.displayName}`}
                                    >
                                        {
                                            props.modalData.post.author
                                                .display_name
                                        }
                                    </p>
                                    <p className={styles.username}>
                                        @{props.modalData.post.author.username}
                                    </p>
                                </div>
                            </a>
                        </Link>
                        <PostOptionsMenuButton
                            postId={props.modalData.post.id}
                            postAuthorId={props.modalData.post.author.id}
                            postAuthorUsername={props.modalData.post.author.username}
                            currentUserId={props.modalData.currentUser?.id}
                            deleteCallback={() => {
                                props.goBackTwice
                                    ? window.history.go(-2)
                                    : window.history.back();
                            }}
                        ></PostOptionsMenuButton>
                    </div>
                    {props.modalData.post.content && (
                        <p className={styles.postText}>
                            {props.modalData.post.content}
                        </p>
                    )}
                    <div className="flex gap-1 justify-content-end">
                        <CommentButton
                            post={props.modalData.post}
                            handleClick={handleCommentClick}
                        ></CommentButton>
                        <LikeButton
                            post={props.modalData.post}
                            currentUserId={props.modalData.currentUser?.id}
                            likes={postLikes}
                            liked={postLiked}
                        ></LikeButton>
                    </div>
                    <p className={styles.date}>
                        {formatDate(props.modalData.post.created_at)}
                    </p>
                </div>
                <div ref={parentContainerRef} className={styles.modalPostComments}>
                    {!commentsLoading ? (
                        <>
                            {comments.map((comment) => {
                                return (
                                    <MediaModalComment
                                        key={comment.id}
                                        comment={comment}
                                        currentUser={
                                            props.modalData.currentUser
                                        }
                                        handleMediaClick={
                                            props.handleMediaClick
                                        }
                                        parentContainerRef={parentContainerRef}
                                    ></MediaModalComment>
                                );
                            })}
                        </>
                    ) : (
                        <Loading height="50" width="50"></Loading>
                    )}
                </div>
                {props.modalData.currentUser && (
                    <div className={messagesStyles.messageInputContainer}>
                        <div
                            className={`${styles.charLimit} ${
                                charsLeft < 0 ? styles.charLimitReached : ""
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
                                nowCommenting
                                    ? styles.progressBarInProgress
                                    : ""
                            }`}
                        ></div>
                        {attachments.length != 0 && (
                            <div className={styles.previewImagesContainer}>
                                {previewImages.map((previewImage, i) => {
                                    return (
                                        <div
                                            key={i}
                                            className={styles.previewImage}
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
                        <div className={messagesStyles.messageInputArea}>
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
                                            handleAttachmentChange(
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
                                        opacity={
                                            commentingAllowed ? "1" : "0.3"
                                        }
                                    ></PaperPlane>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className={styles.modalImageContainer}>
                <Swiper
                    slidesPerView={1}
                    initialSlide={props.modalData.imageIndex}
                    onInit={(swiper) => {
                        (swiper.navigation as NavigationMethods).init();
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        swiper.params.navigation.prevEl = prevRef.current;
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        swiper.params.navigation.nextEl = nextRef.current;
                        (swiper.navigation as NavigationMethods).update();
                    }}
                >
                    {props.modalData.post.attachments.length > 1 && (
                        <>
                            <div
                                ref={prevRef}
                                className={`${styles.icon} ${styles.imageNavigation} ${styles.imageNavigationPrev}`}
                            >
                                <ArrowLeft
                                    color="white"
                                    weight="bold"
                                    size="20"
                                ></ArrowLeft>
                            </div>
                            <div
                                ref={nextRef}
                                className={`${styles.icon} ${styles.imageNavigation} ${styles.imageNavigationNext}`}
                            >
                                <ArrowRight
                                    color="white"
                                    weight="bold"
                                    size="20"
                                ></ArrowRight>
                            </div>
                        </>
                    )}
                    {props.modalData.post.attachments.map((_attachment, i) => {
                        return (
                            <SwiperSlide key={i}>
                                <img
                                    className={styles.modalImage}
                                    src={`${props.modalData.post.attachments[i].url}`}
                                    height="100%"
                                    width="100%"
                                    alt="Post's attached image expanded"
                                />
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
                <div
                    className={`${styles.icon} ${styles.closeModal}`}
                    onClick={() => {
                        window.history.back();
                    }}
                >
                    <X color="white" weight="bold" size="20"></X>
                </div>
            </div>
        </div>
    );
}
