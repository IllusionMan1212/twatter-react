import { Dispatch, MutableRefObject, ReactElement, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import styles from "./commentBox.module.scss";
import {
    handlePreviewImageClose,
    handlePaste,
    handleAttachmentChange,
    handleInput,
    handleKeyDown,
    handleTextInput,
} from "src/utils/eventHandlers";
import { X, PaperPlane, ImageSquare } from "phosphor-react";
import { useUserContext } from "src/contexts/userContext";
import { CommentBoxProps } from "src/types/props";
import { postCharLimit } from "src/utils/variables";
import { IAttachment } from "src/types/general";
import { useGlobalContext } from "src/contexts/globalContext";

interface CharLimitProps {
    charLimit: number;
    charsLeft: number;
}

interface UploadProgressProps {
    nowUploading: boolean;
}

interface BaseAttachmentProps {
    attachments: IAttachment[];
    setAttachments: Dispatch<SetStateAction<IAttachment[]>>;
    previewImages: string[];
    setPreviewImages: Dispatch<SetStateAction<string[]>>;
    setCommentingAllowed: Dispatch<SetStateAction<boolean>>;
}

interface AttachmentsPreviewProps extends BaseAttachmentProps {
    commentBoxRef: MutableRefObject<HTMLDivElement>;
}

interface AttachmentButtonProps extends BaseAttachmentProps {
    showToast: (text: string, length: number) => void;
}

interface SendButtonProps {
    commentingAllowed: boolean;
    handleClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => Promise<void>;
}

function CharLimit({ charLimit, charsLeft }: CharLimitProps) {
    return (
        <div
            className={`${styles.charLimit} ${
                charsLeft < 0 ? styles.charLimitReached : ""
            }`}
            style={{
                width: `${
                    ((charLimit - charsLeft) * 100) /
                    charLimit
                }%`,
            }}
        />
    );
}

function UploadProgress({ nowUploading }: UploadProgressProps) {
    return (
        <div
            className={`${styles.progressBar} ${
                nowUploading ? styles.progressBarInProgress : ""
            }`}
        />
    );
}

function AttachmentsPreview(props: AttachmentsPreviewProps) {
    return (
        <div className={styles.previewImagesContainer}>
            {props.previewImages.map((previewImage, i) => {
                return (
                    <div
                        key={i}
                        className={styles.previewImage}
                        style={{
                            backgroundImage: `url(${previewImage})`,
                        }}
                    >
                        <div className={`${styles.previewImageOverlay}`} />
                        <div
                            className={styles.previewImageClose}
                            onClick={(e) =>
                                handlePreviewImageClose(
                                    e,
                                    i,
                                    props.previewImages,
                                    props.setPreviewImages,
                                    props.attachments,
                                    props.setAttachments,
                                    props.commentBoxRef,
                                    props.setCommentingAllowed
                                )
                            }
                        >
                            <X weight="bold" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function AttachmentButton({ showToast, ...props }: AttachmentButtonProps) {
    return (
        <div className={`${styles.sendMessageButton}`}>
            <ImageSquare size="30" color="white" />
            <input
                className={styles.fileInput}
                onChange={(e) =>
                    handleAttachmentChange(
                        e,
                        props.attachments,
                        props.setAttachments,
                        props.previewImages,
                        props.setPreviewImages,
                        props.setCommentingAllowed,
                        showToast
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
    );
}

function SendButton(props: SendButtonProps) {
    return (
        <button
            className={styles.button}
            disabled={props.commentingAllowed ? false : true}
            onClick={props.handleClick}
        >
            <PaperPlane
                size="30"
                color="#6067fe"
                opacity={props.commentingAllowed ? "1" : "0.3"}
            />
        </button>
    );
}

export default function CommentBox(props: CommentBoxProps): ReactElement {
    const { socket, user: currentUser } = useUserContext();
    const { showToast } = useGlobalContext();

    const commentBoxRef = useRef<HTMLDivElement>(null);

    const [charsLeft, setCharsLeft] = useState(postCharLimit);
    const [attachments, setAttachments] = useState<Array<IAttachment>>([]);
    const [previewImages, setPreviewImages] = useState<Array<string>>([]);
    const [nowCommenting, setNowCommenting] = useState(false);
    const [commentingAllowed, setCommentingAllowed] = useState(false);

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
                author: currentUser,
                attachments: attachmentsToSend,
                replying_to: props.postId,
            },
        };
        commentBoxRef.current.textContent = "";
        setAttachments([]);
        setPreviewImages([]);
        setCommentingAllowed(false);
        setCharsLeft(postCharLimit);

        socket.send(JSON.stringify(payload));
    };

    const handleComment = useCallback(() => {
        setNowCommenting(false);
    }, []);

    useEffect(() => {
        setCommentingAllowed(false);
        setCharsLeft(postCharLimit);
        setAttachments([]);
        setPreviewImages([]);
        setNowCommenting(false);
    }, [props.postId]);

    useEffect(() => {
        const commentBox = commentBoxRef?.current;

        commentBox?.addEventListener(
            "textInput",
            handleTextInput as never
        );

        return () => {
            commentBox?.removeEventListener(
                "textInput",
                handleTextInput as never
            );
        };
    });

    useEffect(() => {
        if (socket) {
            socket.on("commentToClient", handleComment);
        }

        return () => {
            socket.off("commentToClient", handleComment);
        };
    }, [socket, handleComment]);

    if (!currentUser) return null;

    return (
        <>
            <div className={styles.messageInputContainer}>
                <CharLimit charLimit={postCharLimit} charsLeft={charsLeft} />
                <UploadProgress nowUploading={nowCommenting} />
                {attachments.length != 0 && (
                    <AttachmentsPreview
                        commentBoxRef={commentBoxRef}
                        attachments={attachments}
                        setAttachments={setAttachments}
                        previewImages={previewImages}
                        setPreviewImages={setPreviewImages}
                        setCommentingAllowed={setCommentingAllowed}
                    />
                )}
                <div className={styles.messageInputArea}>
                    <span
                        ref={commentBoxRef}
                        className={styles.messageInput}
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
                                showToast
                            )
                        }
                        onKeyDown={(e) =>
                            handleKeyDown(
                                e,
                                commentBoxRef,
                                handleClick
                            )
                        }
                    />
                    <div className={`flex ${styles.messageInputOptions}`}>
                        <AttachmentButton
                            attachments={attachments}
                            setAttachments={setAttachments}
                            previewImages={previewImages}
                            setPreviewImages={setPreviewImages}
                            setCommentingAllowed={setCommentingAllowed}
                            showToast={showToast}
                        />
                        <SendButton commentingAllowed={commentingAllowed} handleClick={handleClick} />
                    </div>
                </div>
            </div>
        </>
    );
}
