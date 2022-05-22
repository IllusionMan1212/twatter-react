import { X, ArrowLeft, ArrowRight } from "phosphor-react";
import styles from "./mediaModal.module.scss";
import { MutableRefObject, ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { formatDate } from "src/utils/functions";
import LikeButton from "components/buttons/likeButton";
import { MediaModalProps } from "src/types/props";
import PostOptionsMenuButton from "components/buttons/postOptionsMenuButton";
import { Navigation, Keyboard } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Loading from "components/loading";
import axios from "axios";
import { IPost } from "src/types/general";
import MediaModalComment from "./mediaModalComment";
import Link from "next/link";
import CommentButton from "components/buttons/commentButton";
import { LikePayload } from "src/types/utils";
import ProfileImage from "components/post/profileImage";
import { useUserContext } from "src/contexts/userContext";
import { AxiosResponse } from "axios";
import CommentBox from "components/commentBox/commentBox";
import DateTime from "components/datetime";
import { useGlobalContext } from "src/contexts/globalContext";

interface NavButtonProps {
    buttonRef: MutableRefObject<HTMLDivElement>;
}

interface CloseModalButtonProps {
    clearMediaModalStack: () => void;
}

function NavLeftButton({ buttonRef }: NavButtonProps) {
    return (
        <div
            ref={buttonRef}
            className={`${styles.icon} ${styles.imageNavigation} ${styles.imageNavigationPrev}`}
        >
            <ArrowLeft color="white" weight="bold" size="20" />
        </div>
    );
}

function NavRightButton({ buttonRef }: NavButtonProps) {
    return (
        <div
            ref={buttonRef}
            className={`${styles.icon} ${styles.imageNavigation} ${styles.imageNavigationNext}`}
        >
            <ArrowRight color="white" weight="bold" size="20" />
        </div>
    );
}

function CloseModalButton({ clearMediaModalStack }: CloseModalButtonProps) {
    return (
        <div
            className={`${styles.icon} ${styles.closeModal}`}
            onClick={() => clearMediaModalStack()}
        >
            <X color="white" weight="bold" size="20" />
        </div>
    );
}

export default function MediaModal(props: MediaModalProps): ReactElement {
    const { socket } = useUserContext();
    const { showToast } = useGlobalContext();

    const prevRef = useRef<HTMLDivElement>(null);
    const nextRef = useRef<HTMLDivElement>(null);
    const parentContainerRef = useRef<HTMLDivElement>(null);

    const [commentsLoading, setCommentsLoading] = useState(true);
    const [comments, setComments] = useState<Array<IPost>>([]);
    const [postLikes, setPostLikes] = useState(props.modalData.post.likes);
    const [postLiked, setPostLiked] = useState(props.modalData.post.liked);

    const handleWindowKeyDown = (e: KeyboardEvent) => {
        e.key == "Escape" && window.history.back();
    };

    const handleCommentClick = () => {
        // TODO:
    };

    const handleComment = useCallback(
        (payload) => {
            setComments([payload].concat(comments));
            showToast("Commented Successfully", 2000);
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
            if (payload.postId != props.modalData.post.id) {
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
                        showToast(
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

    useEffect(() => {
        window?.addEventListener("keydown", handleWindowKeyDown);

        return () => {
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
                                    alt={props.modalData.post.author.username}
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
                            deleteCallback={() => {
                                props.goBackTwice
                                    ? window.history.go(-2)
                                    : window.history.back();
                            }}
                        />
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
                        />
                        <LikeButton
                            post={props.modalData.post}
                            likes={postLikes}
                            liked={postLiked}
                        />
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
                            {comments.map((comment) => (
                                <MediaModalComment
                                    key={comment.id}
                                    comment={comment}
                                    handleMediaClick={
                                        props.handleMediaClick
                                    }
                                    parentContainerRef={parentContainerRef}
                                />
                            ))}
                        </>
                    ) : (
                        <Loading height="50" width="50"/>
                    )}
                </div>
                <CommentBox postId={props.modalData.post.id} />
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
                            <NavLeftButton buttonRef={prevRef} />
                            <NavRightButton buttonRef={nextRef} />
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
                <CloseModalButton clearMediaModalStack={clearMediaModalStack} />
            </div>
        </div>
    );
}
