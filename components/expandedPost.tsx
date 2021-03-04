/* eslint-disable react/react-in-jsx-scope */
import { ChangeEvent, FormEvent, ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { ExpandedPostProps } from "../src/types/props";
import styles from "./expandedPost.module.scss";
import postStyles from "./post.module.scss";
import Link from "next/link";
import { formatDate, timeSince } from "../src/utils/functions";
import LikeButton from "./likeButton";
import PostOptionsMenuButton from "./postOptionsMenuButton";
import { ImageSquare, PaperPlane, X } from "phosphor-react";
import messagesStyles from "../styles/messages.module.scss";
import { useToastContext } from "../src/contexts/toastContext";
import { connectSocket, socket } from "../src/contexts/socket";
import mediaModalStyles from "./mediaModal.module.scss";

export default function ExpandedPost(props: ExpandedPostProps): ReactElement {
    const charLimit = 128;
    const maxAttachments = 4;

    const toast = useToastContext();

    const commentBoxRef = useRef<HTMLSpanElement>(null);

    const [commentingAllowed, setCommentingAllowed] = useState(false);
    const [attachments, setAttachments] = useState<Array<{data: File, name: string, mimetype: string}>>([]);
    const [previewImages, setPreviewImages] = useState<Array<string>>([]);
    const [charsLeft, setCharsLeft] = useState(charLimit);
    const [nowCommenting, setNowCommenting] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files: File[] = Array.from((e.target?.files) as ArrayLike<File>);
        const validFiles: Array<{data: File, name: string, mimetype: string}> = [...attachments];
        const validPreviewImages: Array<string> = [...previewImages];

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
            if (
                attachments.length < maxAttachments &&
                previewImages.length < maxAttachments
            ) {
                validFiles.push({
                    data: files[i],
                    name: files[i].name,
                    mimetype: files[i].type,
                });
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

    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (!commentingAllowed) {
            e.preventDefault();
            return;
        }
        if (commentBoxRef?.current?.textContent.trim().length > charLimit) {
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
        setCharsLeft(charLimit);
        if (socket) {
            socket?.emit("commentToServer", payload);
        } else {
            console.log("socket not connected, trying to connect");
            connectSocket(props.currentUser.token);
            socket?.emit("commentToServer", payload);
        }
        toast("Commented Successfully", 3000);
        console.log(nowCommenting);
        setNowCommenting(false);
    };

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

    const handlePaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
        e.preventDefault();
        // handle pasting strings as plain text
        if (
            e.clipboardData.items.length &&
            e.clipboardData.items[0].kind == "string"
        ) {
            const text = e.clipboardData.getData("text/plain");
            (e.target as HTMLElement).textContent += text;

            if ((e.target as HTMLElement).textContent.length > charLimit) {
                setCommentingAllowed(false);
            } else if ((e.target as HTMLElement).textContent.length) {
                setCommentingAllowed(true);
            }
            setCharsLeft(
                charLimit - (e.target as HTMLElement).textContent.length
            );
            // handle pasting images
        } else if (
            e.clipboardData.items.length &&
            e.clipboardData.items[0].kind == "file"
        ) {
            const file = e.clipboardData.items[0].getAsFile();
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
            setAttachments(
                attachments.concat({
                    data: file,
                    name: file.name,
                    mimetype: file.type,
                })
            );
            if (charsLeft >= 0) {
                setCommentingAllowed(true);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (e.key == "Enter") {
            e.preventDefault();

            if (!commentBoxRef.current.textContent.length) return;

            document.execCommand("insertLineBreak");

            e.ctrlKey && handleClick(e as unknown as React.MouseEvent<HTMLElement, MouseEvent>);
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

    const handleComment = useCallback(
        (payload) => {
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
                                alt="User profile picture"
                            />
                        </a>
                    </Link>
                    <div className={styles.user}>
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
                    </div>
                    <div className={`ml-1 ${postStyles.postText} ${styles.expandedPostText}`}>
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
                    <LikeButton
                        post={props.post}
                        currentUserId={props.currentUser?._id}
                    ></LikeButton>
                </div>
            </div>
            <div className={styles.commentsSection}>
                {props.post.comments.map((comment, i) => {
                    return (
                        <div className={styles.comment} key={i}>
                            <div className={styles.commentUser}>
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
                                <div className="text-bold justify-content-center">
                                    <p>{comment.author.display_name}</p>
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
                                <LikeButton
                                    post={comment}
                                    currentUserId={props.currentUser?._id}
                                ></LikeButton>
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
                                ((charLimit - charsLeft) * 100) / charLimit
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
                    <div className={`${messagesStyles.messageInputArea}`}>
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
            )}
        </>
    );
}
