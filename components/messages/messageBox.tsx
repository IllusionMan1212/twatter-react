import { FormEvent, ReactElement, useEffect, useState } from "react";
import { PaperPlane, ImageSquare, X } from "phosphor-react";
import styles from "./messageBox.module.scss";
import {
    handlePaste,
    handlePreviewImageClose,
    handleAttachmentChange,
} from "src/utils/eventHandlers";
import { useUserContext } from "src/contexts/userContext";
import { MessageBoxProps } from "src/types/props";
import { messageCharLimit } from "src/utils/variables";
import { useToastContext } from "src/contexts/toastContext";

export default function MessageBox(props: MessageBoxProps): ReactElement {
    const { user, socket } = useUserContext();
    const toast = useToastContext();

    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>(null);

    const handleInput = (e: FormEvent<HTMLInputElement>) => {
        if (!timeoutId) {
            const payload = {
                eventType: "typing",
                data: {
                    receiverId: props.state.activeConversation.receiver_id,
                    conversationId: props.state.activeConversation.id,
                },
            };
            socket.send(JSON.stringify(payload));

            setTimeoutId(
                setTimeout(() => {
                    clearTimeout(timeoutId);
                    setTimeoutId(null);
                }, 3500)
            );
        }

        if (e.currentTarget.textContent.trim().length > messageCharLimit) {
            props.setSendingAllowed(false);
        } else if (
            e.currentTarget.textContent.trim().length != 0 ||
            props.attachments.length
        ) {
            props.setSendingAllowed(true);
        } else {
            props.setSendingAllowed(false);
        }
        props.setCharsLeft(
            messageCharLimit - e.currentTarget.textContent.trim().length
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (e.key == "Enter") {
            e.preventDefault();

            if (
                !props.messageBoxRef.current.textContent.length &&
                !props.attachments?.[0]?.data
            )
                return;

            if (window.innerWidth > 800) {
                !e.shiftKey &&
                    handleClickSend(
                        e as unknown as React.MouseEvent<
                            HTMLElement,
                            MouseEvent
                        >
                    );
                e.shiftKey && document.execCommand("insertLineBreak");
            } else if (window.innerWidth <= 800) {
                document.execCommand("insertLineBreak");
            }
        }
    };

    const handleClickSend = async (
        e: React.MouseEvent<HTMLElement, MouseEvent>
    ) => {
        if (!props.sendingAllowed) {
            e.preventDefault();
            return;
        }
        if (
            props.messageBoxRef.current.textContent.trim().length >
            messageCharLimit
        ) {
            e.preventDefault();
            return;
        }
        if (
            props.messageBoxRef.current.textContent.length == 0 &&
            !props.attachments.length
        ) {
            e.preventDefault();
            return;
        }
        const messageContent = props.messageBoxRef.current.innerText
            .replace(/(\n){2,}/g, "\n\n")
            .trim();
        props.setNowSending(true);

        const attachmentArrayBuffer =
            await props.attachments?.[0]?.data.arrayBuffer();
        const attachmentBuffer = new Uint8Array(attachmentArrayBuffer);
        const data = Buffer.from(attachmentBuffer).toString("base64");

        const messagePayload = {
            eventType: "message",
            data: {
                conversation_id: props.state.activeConversation.id,
                receiver_id: props.state.activeConversation.receiver_id,
                sender_id: user.id,
                message_content: messageContent,
                attachment: {
                    data: data || "",
                    mimetype: props.attachments?.[0]?.mimetype || "",
                },
            },
        };

        clearTimeout(timeoutId);
        setTimeoutId(null);

        props.messageBoxRef.current.textContent = "";
        props.setAttachments([]);
        props.setPreviewImages([]);
        props.setSendingAllowed(false);
        props.setCharsLeft(messageCharLimit);
        socket.send(JSON.stringify(messagePayload));
    };

    const handleTextInput = (e: InputEvent) => {
        // workaround android not giving out proper key codes
        if (window.innerWidth <= 800) {
            if (
                e.data.charCodeAt(0) == 10 ||
                e.data.charCodeAt(e.data.length - 1) == 10
            ) {
                e.preventDefault();
                document.execCommand("insertLineBreak");
            }
        }
    };

    useEffect(() => {
        const messageInput = props.messageBoxRef?.current;
        messageInput?.addEventListener(
            "textInput",
            handleTextInput as never
        );

        return () => {
            messageInput?.removeEventListener(
                "textInput",
                handleTextInput as never
            );
        };
    });

    return (
        <div className={styles.messageInputContainer}>
            <div
                className={`${styles.charLimit} ${
                    props.charsLeft < 0 ? styles.charLimitReached : ""
                }`}
                style={{
                    width: `${
                        ((messageCharLimit - props.charsLeft) * 100) /
                        messageCharLimit
                    }%`,
                }}
            ></div>
            <div
                className={`${styles.progressBar} ${
                    props.nowSending ? styles.progressBarInProgress : ""
                }`}
            ></div>
            {props.previewImages.map((previewImage, i) => {
                return (
                    <div className={styles.messageAttachment} key={i}>
                        <div
                            className={styles.previewImage}
                            style={{
                                backgroundImage: `url("${previewImage}")`,
                            }}
                        >
                            <div
                                className={`${styles.previewImageOverlay}`}
                            ></div>
                            <div
                                className={styles.previewImageClose}
                                onClick={(e) => {
                                    handlePreviewImageClose(
                                        e,
                                        i,
                                        props.previewImages,
                                        props.setPreviewImages,
                                        props.attachments,
                                        props.setAttachments,
                                        props.messageBoxRef,
                                        props.setSendingAllowed
                                    );
                                }}
                            >
                                <X weight="bold"></X>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div className={styles.messageInputArea}>
                <span
                    ref={props.messageBoxRef}
                    className={styles.messageInput}
                    contentEditable="true"
                    data-placeholder="Send a message..."
                    onInput={handleInput}
                    onPaste={(e) => {
                        handlePaste(
                            e,
                            messageCharLimit,
                            props.charsLeft,
                            props.setCharsLeft,
                            props.setSendingAllowed,
                            props.previewImages,
                            props.setPreviewImages,
                            props.attachments,
                            props.setAttachments,
                            toast,
                            1
                        );
                    }}
                    onKeyDown={handleKeyDown}
                ></span>
                <div className={`flex ${styles.messageInputOptions}`}>
                    <div className={`${styles.sendMessageButton}`}>
                        <ImageSquare size="30" />
                        <input
                            className={styles.fileInput}
                            onChange={(e) => {
                                handleAttachmentChange(
                                    e,
                                    props.attachments,
                                    props.setAttachments,
                                    props.previewImages,
                                    props.setPreviewImages,
                                    props.setSendingAllowed,
                                    toast,
                                    1
                                );
                            }}
                            onClick={(e) => {
                                e.currentTarget.value = null;
                            }}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        />
                    </div>
                    <button
                        className={styles.button}
                        disabled={props.sendingAllowed ? false : true}
                        onClick={handleClickSend}
                    >
                        <PaperPlane
                            size="30"
                            color="#6067fe"
                            opacity={props.sendingAllowed ? "1" : "0.3"}
                        ></PaperPlane>
                    </button>
                </div>
            </div>
        </div>
    );
}
