import { X, ArrowLeft, ArrowRight } from "phosphor-react";
import styles from "./mediaModal.module.scss";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { formatDate } from "src/utils/functions";
import LikeButton from "components/buttons/likeButton";
import { MediaModalProps } from "src/types/props";
import PostOptionsMenuButton from "components/buttons/postOptionsMenuButton";
import { useToastContext } from "src/contexts/toastContext";
import { Navigation, Keyboard } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Loading from "components/loading";
import axios from "axios";
import { IAttachment, IPost } from "src/types/general";
import { handleTextInput } from "src/utils/eventHandlers";
import { postCharLimit } from "src/utils/variables";
import MediaModalComment from "./mediaModalComment";
import Link from "next/link";
import CommentButton from "components/buttons/commentButton";
import { LikePayload } from "src/types/utils";
import ProfileImage from "components/post/profileImage";
import { useUserContext } from "src/contexts/userContext";
import { AxiosResponse } from "axios";
import CommentBox from "components/commentBox/commentBox";
import DateTime from "components/datetime";

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

    const handleClick = async (
        e: React.MouseEvent<HTMLElement, MouseEvent>
    ) => {
        if (!commentingAllowed) {
            e.preventDefault();
            return;
        }
        if (
            commentBoxRef.current.textContent.trim().length >
            postCharLimit
        ) {
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
        const attachmentsToSend = [];
        for (let i = 0; i < attachments.length; i++) {
            const attachmentArrayBuffer = await attachments[
                i
            ].data.arrayBuffer();
            const attachmentBuffer = new Uint8Array(attachmentArrayBuffer);
            const data = Buffer.from(attachmentBuffer).toString("base64");
            const attachment = {
                mimetype: attachments[i].mimetype,
                data: data,
            };
            attachmentsToSend.push(attachment);
        }
        const payload = {
            eventType: "commentToServer",
            data: {
                content: content,
                contentLength: commentBoxRef.current.textContent.length,
                author: props.modalData.currentUser,
                attachments: attachmentsToSend,
                replying_to: props.modalData.post.id,
            },
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
        [props.modalData.post.id]
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
                `${process.env.NEXT_PUBLIC_DOMAIN_URL}/posts/getComments/${props.modalData.post.id}`,
                { cancelToken: tokenSource.token, withCredentials: true }
            )
            .then((res: AxiosResponse<{ comments: IPost[] }>) => {
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
    }, [handleComment, handleCommentDelete, handleLike, socket]);

    // TODO: put this in the commentBox components after mediamodal is refactored
    useEffect(() => {
        const commentBox = commentBoxRef?.current;
        commentBox?.addEventListener(
            "textInput",
            handleTextInput as never
        );

        window?.addEventListener("keydown", handleWindowKeyDown);

        return () => {
            commentBox?.removeEventListener(
                "textInput",
                handleTextInput as never
            );
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
                    <DateTime
                        datetime={props.modalData.post.created_at}
                        formattingFunction={formatDate}
                        className={styles.date}
                    />
                </div>
                <div ref={parentContainerRef} className={styles.modalPostComments}>
                    {!commentsLoading ? (
                        <>
                            {comments.map((comment) => {
                                return (
                                    <MediaModalComment
                                        key={comment.id}
                                        comment={comment}
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
                <CommentBox
                    commentBoxRef={commentBoxRef}
                    charLimit={postCharLimit}
                    charsLeft={charsLeft}
                    setCharsLeft={setCharsLeft}
                    commentingAllowed={commentingAllowed}
                    setCommentingAllowed={setCommentingAllowed}
                    nowCommenting={nowCommenting}
                    setNowCommenting={setNowCommenting}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    previewImages={previewImages}
                    setPreviewImages={setPreviewImages}
                    handleClick={handleClick}
                />
            </div>
            <div className={styles.modalImageContainer}>
                <Swiper
                    modules={[Navigation, Keyboard]}
                    slidesPerView={1}
                    initialSlide={props.modalData.imageIndex}
                    navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current
                    }}
                    keyboard={true}
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
