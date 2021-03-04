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
import { FormEvent, ReactElement, useCallback, useEffect, useRef, useState } from "react";
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
import { connectSocket, socket } from "../src/contexts/socket";

SwiperCore.use([Navigation]);

export default function MediaModal(props: MediaModalProps): ReactElement {
    const charLimit = 128;
    const maxAttachments = 4;

    const toast = useToastContext();

    const commentBoxRef = useRef<HTMLSpanElement>(null);
    const prevRef = useRef<HTMLDivElement>(null);
    const nextRef = useRef<HTMLDivElement>(null);

    const [commentingAllowed, setCommentingAllowed] = useState(false);
    const [charsLeft, setCharsLeft] = useState(charLimit);
    const [attachments, setAttachments] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [nowCommenting, setNowCommenting] = useState(false);

    const handleInput = (e: FormEvent<HTMLSpanElement>) => {
        if ((e.target as HTMLElement).textContent.trim().length > charLimit) {
            setCommentingAllowed(false);
        } else if (
            (e.target as HTMLElement).textContent.trim().length != 0 ||
            attachments.length
        ) {
            setCommentingAllowed(true);
        } else {
            setCommentingAllowed(false);
        }
        setCharsLeft(charLimit - (e.target as HTMLElement).textContent.trim().length);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (e.key == "Enter") {
            e.preventDefault();

            if (!commentBoxRef.current.textContent.length) return;

            document.execCommand("insertLineBreak");

            e.ctrlKey && handleClick(e as unknown as React.MouseEvent<HTMLElement, MouseEvent>);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        // handle pasting strings as plain text
        if (e.clipboardData.items.length && e.clipboardData.items[0].kind == "string") {
            const text = e.clipboardData.getData("text/plain");
            (e.target as HTMLElement).textContent += text;
    
            if ((e.target as HTMLElement).textContent.length > charLimit) {
                setCommentingAllowed(false);
            } else if ((e.target as HTMLElement).textContent.length) {
                setCommentingAllowed(true);
            }
            setCharsLeft(charLimit - (e.target as HTMLElement).textContent.length);
        // handle pasting images
        } else if (e.clipboardData.items.length && e.clipboardData.items[0].kind == "file") {
            const file = e.clipboardData.items[0].getAsFile();
            console.log(file);
            if (
                file.type != "image/jpeg" &&
                file.type != "image/jpg" &&
                file.type != "image/png" &&
                file.type != "image/gif" &&
                file.type != "image/webp"
            ) {
                return;
            }
            if (file.size > 8 * 1024 * 1024) {
                toast("File size is limited to 8MB", 4000);
                return;
            }

            setPreviewImages(previewImages.concat(URL.createObjectURL(file)));
            setAttachments(attachments.concat({data: file, name: file.name, mimetype: file.type}));
            if (charsLeft >= 0) {
                setCommentingAllowed(true);
            }
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (!commentingAllowed) {
            e.preventDefault();
            return;
        }
        if (commentBoxRef.current.textContent.trim().length > charLimit) {
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
        console.log(nowCommenting);
        const content = commentBoxRef.current.innerText.replace(/(\n){2,}/g, "\n\n").trim();
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
        setCharsLeft(charLimit);
        if (socket) {
            socket?.emit("commentToServer", payload);
        } else {
            console.log("socket not connected, trying to connect");
            connectSocket(props.modalData.currentUser.token);
            socket?.emit("commentToServer", payload);
        }
        setNowCommenting(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files: File[] = Array.from(e.target?.files as ArrayLike<File>);
        const validFiles = [...attachments];
        const validPreviewImages = [...previewImages];

        if (files.length > maxAttachments) {
            toast("You can only upload up to 4 images", 4000);
            return;
        }
        for (let i = 0; i < files.length; i++) {
            if (
                files[i].type != "image/jpeg" &&
                files[i].type != "image/jpg" &&
                files[i].type != "image/png" &&
                files[i].type != "image/gif" &&
                files[i].type != "image/webp"
            ) {
                toast("This file format is not supported", 4000);
                continue;
            }
            if (files[i].size > 8 * 1024 * 1024) {
                toast("File size is limited to 8MB", 4000);
                continue;
            }
            if (attachments.length < maxAttachments && previewImages.length < maxAttachments) {
                validFiles.push({data: files[i], name: files[i].name, mimetype: files[i].type});
                validPreviewImages.push(URL.createObjectURL(files[i]));
            }
        }
        if (validPreviewImages.length) {
            setCommentingAllowed(true);
            setPreviewImages(validPreviewImages);
            setAttachments(validFiles);
        }
        // TODO: videos
    };

    const handlePreviewImageClose = (_e: React.MouseEvent<HTMLElement, MouseEvent>, i: number) => {
        const tempPreviewImages = [...previewImages];
        tempPreviewImages.splice(i, 1);
        setPreviewImages(tempPreviewImages);
        const tempAttachments = [...attachments];
        tempAttachments.splice(i, 1);
        setAttachments(tempAttachments);
        // if there're no attachments AND no text, disable the posting button
        if (
            !tempAttachments.length &&
            !commentBoxRef.current.textContent.trim().length
        ) {
            setCommentingAllowed(false);
        }
    };

    const handleTextInput = (e: InputEvent) => {
        // workaround android not giving out proper key codes
        if (
            e.data.charCodeAt(0) == 10 ||
            e.data.charCodeAt(e.data.length - 1) == 10
        ) {
            e.preventDefault();
            document.execCommand("insertLineBreak");
        }
    };

    const handleWindowKeyDown = (e: KeyboardEvent) => {
        e.key == "Escape" && window.history.back();
    };

    const handleComment = useCallback((payload) => {
        setComments([payload].concat(comments));
    }, [comments]);

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
                                    <div className={postStyles.previewComment} key={i}>
                                        {comment.author ? (
                                            <img
                                                className="profileImage"
                                                src={`${
                                                    comment.author?.profile_image ==
                                                      "default_profile.svg"
                                                        ? "/"
                                                        : ""
                                                }${comment.author?.profile_image}`}
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
                                            <p className="ml-1">{comment.content}</p>
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
                                ((charLimit - charsLeft) * 100) / charLimit
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
                                                handlePreviewImageClose(e, i)
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
                            onInput={handleInput}
                            onPaste={handlePaste}
                            onKeyDown={handleKeyDown}
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
                                    onChange={handleChange}
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
