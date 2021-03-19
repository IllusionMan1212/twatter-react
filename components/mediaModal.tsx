/* eslint-disable react/react-in-jsx-scope */
import {
    X,
    ImageSquare,
    PaperPlane,
    ArrowLeft,
    ArrowRight,
} from "phosphor-react";
import styles from "./mediaModal.module.scss";
import messagesStyles from "../styles/messages.module.scss";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { formatDate } from "../src/utils/functions";
import LikeButton from "./likeButton";
import { MediaModalProps } from "../src/types/props";
import PostOptionsMenuButton from "./postOptionsMenuButton";
import { useToastContext } from "../src/contexts/toastContext";
import SwiperCore, { Navigation } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Loading from "./loading";
import axios from "axios";
import postStyles from "./post.module.scss";
import { connectSocket, socket } from "../src/socket";
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

SwiperCore.use([Navigation]);

export default function MediaModal(props: MediaModalProps): ReactElement {
    const toast = useToastContext();

    const commentBoxRef = useRef<HTMLSpanElement>(null);
    const prevRef = useRef<HTMLDivElement>(null);
    const nextRef = useRef<HTMLDivElement>(null);

    const [commentingAllowed, setCommentingAllowed] = useState(false);
    const [charsLeft, setCharsLeft] = useState(postCharLimit);
    const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const [previewImages, setPreviewImages] = useState<Array<string>>([]);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [nowCommenting, setNowCommenting] = useState(false);

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
        // TODO: progress bar thingy
        setNowCommenting(true);
        const content = commentBoxRef.current.innerText
            .replace(/(\n){2,}/g, "\n\n")
            .trim();
        const payload = {
            content: content,
            author: props.modalData.currentUser,
            attachments: attachments,
            replyingTo: props.modalData.post._id,
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
            connectSocket(props.modalData.currentUser.token);
            socket?.emit("commentToServer", payload);
        }
        setNowCommenting(false);
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => {
        e.key == "Escape" && window.history.back();
    };

    const handleComment = useCallback(
        (payload) => {
            setComments([payload].concat(comments));
        },
        [comments]
    );

    useEffect(() => {
        socket?.on("commentToClient", handleComment);

        return () => {
            socket?.off("commentToClient", handleComment);
        };
    }, [socket, handleComment]);

    useEffect(() => {
        axios
            .get(
                `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/posts/getComments/${props.modalData.post._id}`
            )
            .then((res) => {
                setComments(res.data.comments);
                setCommentsLoading(false);
            })
            .catch((err) => {
                setCommentsLoading(false);
                if (err?.response?.data?.status != 404) {
                    toast(
                        err?.response?.data?.message ?? "An error has occurred",
                        4000
                    );
                }
            });
    }, []);

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
            style={{ left: props.modalData.currentUser ? "116px" : "0px" }}
        >
            <div className={`text-white ${styles.modalPost}`}>
                <div className={styles.modalPostContent}>
                    <div className={styles.modalPostUser}>
                        <img
                            className="round"
                            src={`${
                                props.modalData.post.author.profile_image ==
                                "default_profile.svg"
                                    ? "/"
                                    : ""
                            }${props.modalData.post.author.profile_image}`}
                            width="50"
                            height="50"
                            alt="User profile picture"
                        />
                        <p className={styles.username}>
                            {props.modalData.post.author.display_name}
                        </p>
                        <PostOptionsMenuButton
                            postId={props.modalData.post._id}
                            postAuthorId={props.modalData.post.author._id}
                            currentUserId={props.modalData.currentUser._id}
                            callback={() => {
                                props.goBackTwice
                                    ? window.history.go(-2)
                                    : window.history.back();
                            }}
                        ></PostOptionsMenuButton>
                    </div>
                    {props.modalData.post.content && (
                        <p>{props.modalData.post.content}</p>
                    )}
                    <LikeButton
                        post={props.modalData.post}
                        currentUserId={props.modalData.currentUser._id}
                    ></LikeButton>
                    <p className={styles.date}>
                        {formatDate(props.modalData.post.createdAt)}
                    </p>
                </div>
                <div className={styles.modalPostComments}>
                    {!commentsLoading ? (
                        <>
                            {comments.map((comment, i) => {
                                return (
                                    <div
                                        className={postStyles.previewComment}
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
                                                {comment.author?.display_name ??
                                                    "Deleted Account"}
                                            </p>
                                        </div>
                                        <div
                                            className={`text-small ${postStyles.postText}`}
                                        >
                                            <p className="ml-1">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <Loading height="50" width="50"></Loading>
                    )}
                </div>
                <div className={messagesStyles.messageInputContainer}>
                    <div
                        className={`${styles.charLimit} ${
                            charsLeft < 0 ? styles.charLimitReached : ""
                        }`}
                        style={{
                            width: `${
                                ((postCharLimit - charsLeft) * 100) / postCharLimit
                            }%`,
                        }}
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
            </div>
            <div className={styles.modalImageContainer}>
                <Swiper
                    slidesPerView={1}
                    initialSlide={props.modalData.imageIndex}
                    onInit={(swiper) => {
                        swiper.navigation.init();
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        swiper.params.navigation.prevEl = prevRef.current;
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        swiper.params.navigation.nextEl = nextRef.current;
                        swiper.navigation.update();
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
                                    src={`${props.modalData.post.attachments[i]}`}
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
