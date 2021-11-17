/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useEffect, useRef, useState } from "react";
import { ExpandedPostProps } from "src/types/props";
import styles from "./expandedPost.module.scss";
import postStyles from "./post.module.scss";
import Link from "next/link";
import { formatDate } from "src/utils/functions";
import LikeButton from "components/buttons/likeButton";
import PostOptionsMenuButton from "components/buttons/postOptionsMenuButton";
import { IAttachment } from "src/types/general";
import {
    handleTextInput,
} from "src/utils/eventHandlers";
import { postCharLimit } from "src/utils/variables";
import CommentButton from "components/buttons/commentButton";
import Comment from "./comment";
import AttachmentsContainer from "components/attachmentsContainer";
import ProfileImage from "./profileImage";
import { useUserContext } from "src/contexts/userContext";
import Loading from "components/loading";
import ReplyingTo from "./replyingTo";
import CommentBox from "components/commentBox/commentBox";
import DateTime from "components/datetime";

export default function ExpandedPost(props: ExpandedPostProps): ReactElement {
    const { socket } = useUserContext();

    const commentBoxRef = useRef<HTMLSpanElement>(null);
    const parentContainerRef = useRef<HTMLDivElement>(null);

    const [commentingAllowed, setCommentingAllowed] = useState(false);
    const [attachments, setAttachments] = useState<Array<IAttachment>>([]);
    const [previewImages, setPreviewImages] = useState<Array<string>>([]);
    const [charsLeft, setCharsLeft] = useState(postCharLimit);

    const handleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
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

        const attachmentsToSend = [];
        for (let i = 0; i < attachments.length; i++) {
            const attachmentArrayBuffer =
                await attachments[i].data.arrayBuffer();
            const attachmentBuffer = new Uint8Array(attachmentArrayBuffer);
            const data = Buffer.from(attachmentBuffer).toString("base64");
            const attachment = {
                mimetype: attachments[0].mimetype,
                data: data
            };
            attachmentsToSend.push(attachment);
        }
        const payload = {
            eventType: "commentToServer",
            data: {
                content: content,
                contentLength: commentBoxRef?.current?.textContent.length,
                author: props.currentUser,
                attachments: attachmentsToSend,
                replying_to: props.post.id
            },
        };
        commentBoxRef.current.textContent = "";
        setAttachments([]);
        setPreviewImages([]);
        setCommentingAllowed(false);
        setCharsLeft(postCharLimit);
        socket.send(JSON.stringify(payload));
    };

    const handleCommentButtonClick = () => {
        commentBoxRef?.current?.focus();
    };

    // TODO: put this in the commentBox components after mediamodal is refactored
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

    return (
        <>
            <div className={`mx-auto ${styles.expandedPost}`}>
                <div className={styles.expandedPostContent}>
                    {props.post.replying_to.id.Valid && (
                        <ReplyingTo
                            post_id={props.post.replying_to.id.String}
                            avatar_url={props.post.replying_to.author.avatar_url.String}
                            avatar_size={30}
                            username={props.post.replying_to.author.username.String}
                            content={props.post.replying_to.content}
                        />
                    )}
                    <ProfileImage
                        width={50}
                        height={50}
                        src={props.post.author.avatar_url}
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
                        postId={props.post.id}
                        postAuthorId={props.post.author.id}
                        postAuthorUsername={props.post.author.username}
                        currentUserId={props.currentUser?.id}
                        deleteCallback={props.callback}
                    ></PostOptionsMenuButton>
                    <div
                        className={`ml-1 mt-1 ${postStyles.postText} ${styles.expandedPostText}`}
                    >
                        <p>{props.post.content}</p>
                        <AttachmentsContainer
                            post={props.post}
                            handleMediaClick={props.handleMediaClick}
                        ></AttachmentsContainer>
                    </div>
                </div>
                <div className={styles.postFooter}>
                    <DateTime
                        datetime={props.post.created_at}
                        formattingFunction={formatDate}
                        className={`flex align-items-end text-small ${postStyles.postDate}`}
                    />
                    <div className="flex gap-1">
                        <CommentButton
                            post={props.post}
                            handleClick={handleCommentButtonClick}
                        ></CommentButton>
                        <LikeButton
                            post={props.post}
                            currentUserId={props.currentUser?.id}
                            likes={props.post.likes}
                            liked={props.post.liked}
                        ></LikeButton>
                    </div>
                </div>
            </div>
            <div ref={parentContainerRef} className={styles.commentsSection}>
                {props.loadingComments ? (
                    <Loading width="50" height="50" />
                ) : (
                    props.comments.map((comment) => {
                        return (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                currentUser={props.currentUser}
                                handleMediaClick={props.handleMediaClick}
                                parentContainerRef={parentContainerRef}
                            ></Comment>
                        );
                    })
                )}
            </div>
            {props.currentUser && (
                <CommentBox
                    commentBoxRef={commentBoxRef}
                    charLimit={postCharLimit}
                    charsLeft={charsLeft}
                    setCharsLeft={setCharsLeft}
                    commentingAllowed={commentingAllowed}
                    setCommentingAllowed={setCommentingAllowed}
                    nowCommenting={props.nowCommenting}
                    setNowCommenting={props.setNowCommenting}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    previewImages={previewImages}
                    setPreviewImages={setPreviewImages}
                    handleClick={handleClick}
                />
            )}
        </>
    );
}
