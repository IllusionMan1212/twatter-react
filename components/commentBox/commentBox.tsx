import { ReactElement } from "react";
import styles from "./commentBox.module.scss";
import {
    handlePreviewImageClose,
    handlePaste,
    handleAttachmentChange,
    handleInput,
    handleKeyDown,
} from "src/utils/eventHandlers";
import { X, PaperPlane, ImageSquare } from "phosphor-react";
import { useToastContext } from "src/contexts/toastContext";
import { useUserContext } from "src/contexts/userContext";
import { CommentBoxProps } from "src/types/props";
export default function CommentBox(props: CommentBoxProps): ReactElement {
    const toast = useToastContext();
    const { user: currentUser } = useUserContext();

    return (
        <>
            {currentUser && (
                <div className={styles.messageInputContainer}>
                    <div
                        className={`${styles.charLimit} ${
                            props.charsLeft < 0 ? styles.charLimitReached : ""
                        }`}
                        style={{
                            width: `${
                                ((props.charLimit - props.charsLeft) * 100) /
                                props.charLimit
                            }%`,
                        }}
                    ></div>
                    <div
                        className={`${styles.progressBar} ${
                            props.nowCommenting
                                ? styles.progressBarInProgress
                                : ""
                        }`}
                    ></div>
                    {props.attachments.length != 0 && (
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
                    )}
                    <div className={styles.messageInputArea}>
                        <span
                            ref={props.commentBoxRef}
                            className={styles.messageInput}
                            contentEditable="true"
                            data-placeholder="Comment on this..."
                            onInput={(e) =>
                                handleInput(
                                    e,
                                    props.charLimit,
                                    props.attachments,
                                    props.setCommentingAllowed,
                                    props.setCharsLeft
                                )
                            }
                            onPaste={(e) =>
                                handlePaste(
                                    e,
                                    props.charLimit,
                                    props.charsLeft,
                                    props.setCharsLeft,
                                    props.setCommentingAllowed,
                                    props.previewImages,
                                    props.setPreviewImages,
                                    props.attachments,
                                    props.setAttachments,
                                    toast
                                )
                            }
                            onKeyDown={(e) =>
                                handleKeyDown(
                                    e,
                                    props.commentBoxRef,
                                    props.handleClick
                                )
                            }
                        ></span>
                        <div className={`flex ${styles.messageInputOptions}`}>
                            <div className={`${styles.sendMessageButton}`}>
                                <ImageSquare size="30" color="white"/>
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
                                className={styles.button}
                                disabled={
                                    props.commentingAllowed ? false : true
                                }
                                onClick={props.handleClick}
                            >
                                <PaperPlane
                                    size="30"
                                    color="#6067fe"
                                    opacity={
                                        props.commentingAllowed ? "1" : "0.3"
                                    }
                                ></PaperPlane>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
