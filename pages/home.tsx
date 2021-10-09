/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "components/statusBar";
import Head from "next/head";
import Loading from "components/loading";
import Navbar from "components/navbar";
import styles from "styles/home.module.scss";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowElbowRightDown,
    ImageSquare,
    PaperPlaneRight,
    PenNibStraight,
    X,
} from "phosphor-react";
import Post from "components/post/post";
import axiosInstance from "src/axios";
import { useToastContext } from "src/contexts/toastContext";
import MediaModal from "components/mediaModal/mediaModal";
import { IAttachment, IPost, IUser } from "src/types/general";
import {
    handleAttachmentChange,
    handleInput,
    handleKeyDown,
    handlePaste,
    handlePreviewImageClose,
    handleTextInput,
} from "src/utils/eventHandlers";
import { postCharLimit } from "src/utils/variables";
import axios, { AxiosResponse } from "axios";
import { LikePayload } from "src/types/utils";
import { Virtuoso } from "react-virtuoso";
import { useUserContext } from "src/contexts/userContext";
import useLatestState from "src/hooks/useLatestState";

export default function Home(): ReactElement {
    const { user, socket } = useUserContext();

    const composePostRef = useRef<HTMLSpanElement>(null);
    const composePostButtonMobileRef = useRef<HTMLDivElement>(null);
    const inputContainerMobileRef = useRef<HTMLDivElement>(null);

    const toast = useToastContext();

    const [postingAllowed, setPostingAllowed] = useState(false);
    const [charsLeft, setCharsLeft] = useState(postCharLimit);
    const [mobileCompose, setMobileCompose] = useState(false);
    const [posts, setPosts] = useLatestState<Array<IPost>>([]);
    const [attachments, setAttachments] = useState<Array<IAttachment>>([]);
    const [previewImages, setPreviewImages] = useState<Array<string>>([]);
    const [nowPosting, setNowPosting] = useState(false);
    const [mediaModal, setMediaModal] = useState(false);
    const [modalData, setModalData] = useState({
        post: null as IPost,
        imageIndex: 0,
        currentUser: null as IUser,
    });
    const [touchY, setTouchY] = useState(null);
    const [reachedEnd, setReachedEnd] = useState(false);
    const [page, setPage] = useLatestState(0);

    const handleClick = async (
        e: React.MouseEvent<HTMLElement, MouseEvent>
    ) => {
        if (!postingAllowed) {
            e.preventDefault();
            return;
        }
        if (composePostRef.current.textContent.trim().length > postCharLimit) {
            e.preventDefault();
            return;
        }
        if (
            composePostRef.current.textContent.length == 0 &&
            attachments.length == 0
        ) {
            e.preventDefault();
            return;
        }
        setNowPosting(true);
        const content = composePostRef.current.innerText
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
            eventType: "post",
            data: {
                content: content,
                contentLength: composePostRef.current.textContent.length,
                author: user,
                attachments: attachmentsToSend 
            },
        };
        composePostRef.current.textContent = "";
        setAttachments([]);
        setPreviewImages([]);
        setPostingAllowed(false);
        setCharsLeft(postCharLimit);
        socket.send(JSON.stringify(payload));
    };

    const handleMediaClick = (
        _e: React.MouseEvent<HTMLElement, MouseEvent>,
        post: IPost,
        index: number
    ) => {
        setModalData({
            post: post,
            imageIndex: index,
            currentUser: user,
        });
        setMediaModal(true);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        setTouchY(e.targetTouches[0]?.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
        if (
            window.innerWidth <= 800 &&
            e.targetTouches[0]?.clientY - touchY > 0
        ) {
            e.currentTarget.style.transform = `translate(0, ${
                e.targetTouches[0]?.clientY - touchY
            }px)`;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        inputContainerMobileRef.current.style.transitionDuration = "300ms";

        if (e.changedTouches[0]?.clientY > touchY + 200) {
            closeMobileComposeSmoothly();
        } else if (mobileCompose) {
            inputContainerMobileRef.current.style.transform = "translate(0, 0)";
            setTimeout(() => {
                inputContainerMobileRef.current.style.transitionDuration =
                    "0ms";
            }, 300);
        }
    };

    const closeMobileComposeSmoothly = () => {
        inputContainerMobileRef.current.style.transform = `translate(0, ${window.innerHeight}px)`;
        setTimeout(() => {
            inputContainerMobileRef.current.style.transform = "translate(0, 0)";
            inputContainerMobileRef.current.style.transitionDuration = "0ms";
            setMobileCompose(false);
        }, 300);
    };

    const handlePost = useCallback(
        (post) => {
            toast("Posted Successfully", 3000);
            setNowPosting(false);
            setMobileCompose(false);

            setPosts([post].concat(posts.current));
        },
        [posts, setPosts, toast]
    );

    const handleDeletePost = useCallback(
        (postIdObj) => {
            const postId = postIdObj.postId;
            if (posts.current.some((post) => {
                return post.id == postId;
            })) {
                setPosts(posts.current.filter((post) => post.id != postId));
            } else {
                // TODO: handle comment deletion. (needed when deleting comments when mediamodal is open)
                // should we even do this ???
            }
        }, [posts, setPosts]);

    // this is for the mediamodal
    const handleComment = useCallback(
        (comment) => {
            setPosts(
                posts.current.map((post) => {
                    if (post.id == comment.replying_to.id.Int64) {
                        post.comments++;
                        return post;
                    }
                    return post;
                })
            );
        },
        [posts, setPosts]
    );

    const handleLike = useCallback(
        (payload: LikePayload) => {
            setPosts(
                posts.current.map((post) => {
                    if (post.id == payload.postId) {
                        if (payload.likeType == "LIKE") {
                            post.liked = true;
                            post.likes++;
                        } else if (payload.likeType == "UNLIKE") {
                            post.liked = false;
                            post.likes--;
                        }
                        return post;
                    }
                    return post;
                })
            );
        },
        [posts, setPosts]
    );

    const handleError = useCallback(
        (payload) => {
            setNowPosting(false);
            toast(payload.message, 3000);
        },
        [toast]
    );

    const getPosts = useCallback((): Promise<IPost[] | void> => {
        const cancelToken = axios.CancelToken;
        const tokenSource = cancelToken.source();
        return axiosInstance
            .get(`posts/getPosts/${page.current}`, {
                cancelToken: tokenSource.token,
            })
            .then((res: AxiosResponse<{ posts: IPost[] }>) => {
                return res.data.posts;
            })
            .catch((err) => {
                if (axios.isCancel(err)) {
                    console.log("Request canceled");
                    tokenSource.cancel();
                } else {
                    console.error(err);
                }
            });
    }, [page]);

    const loadMorePosts = () => {
        setPage(page.current + 1);
        getPosts().then((newPosts) => {
            if (!(newPosts as IPost[]).length) {
                setReachedEnd(true);
                return;
            }
            setPosts(posts.current.concat(newPosts as IPost[]));
        });
    };

    useEffect(() => {
        if (socket) {
            socket.on("commentToClient", handleComment);
            socket.on("like", handleLike);
            socket.on("post", handlePost);
            socket.on("deletePost", handleDeletePost);
            socket.on("postError", handleError);
        }

        return () => {
            if (socket) {
                socket.off("post", handlePost);
                socket.off("deletePost", handleDeletePost);
                socket.off("commentToClient", handleComment);
                socket.off("like", handleLike);
                socket.off("postError", handleError);
            }
        };
    }, [handlePost, handleDeletePost, handleComment, handleLike, handleError, socket]);

    useEffect(() => {
        getPosts().then((posts) => {
            if ((posts as IPost[])?.length < 50) {
                setReachedEnd(true);
            }
            setPosts(posts as IPost[]);
        });
        // TODO: cancel api call on return
    }, [getPosts, setPosts]);

    useEffect(() => {
        const composePost = composePostRef?.current;
        composePost?.addEventListener(
            "textInput",
            handleTextInput as never
        );

        // on browser back button press, close the media modal
        window.onpopstate = () => {
            setMediaModal(false);
        };

        return () => {
            composePost?.removeEventListener(
                "textInput",
                handleTextInput as never
            );
        };
    });

    useEffect(() => {
        if (mobileCompose || mediaModal) {
            document.body.classList.add("overflow-hidden");
            document.body.classList.remove("overflow-unset");
        } else {
            document.body.classList.remove("overflow-hidden");
            document.body.classList.add("overflow-unset");
        }
        return () => {
            document.body.classList.remove("overflow-hidden");
            document.body.classList.add("overflow-unset");
        };
    }, [mobileCompose, mediaModal]);

    return (
        <>
            <Head>
                <title>Home - Twatter</title>
            </Head>
            {user ? (
                <>
                    <Navbar user={user}></Navbar>
                    <div>
                        <StatusBar title="Home" user={user}></StatusBar>
                        <div className={styles.content}>
                            <div className={styles.leftSide}>friends</div>
                            <div className={styles.center}>
                                <div
                                    className={
                                        mobileCompose
                                            ? styles.inputContainer
                                            : ""
                                    }
                                >
                                    <div
                                        className={styles.inputContainerMobile}
                                        ref={inputContainerMobileRef}
                                        onTouchStart={handleTouchStart}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                    >
                                        {/* 75px is the height of the navbar on mobile */}
                                        <div
                                            style={{
                                                minHeight: "calc(50% - 75px)",
                                            }}
                                            onClick={() =>
                                                closeMobileComposeSmoothly()
                                            }
                                        ></div>
                                        <div
                                            className={`flex ${
                                                styles.composePost
                                            } ${
                                                mobileCompose
                                                    ? styles.composePostMobile
                                                    : ""
                                            }`}
                                        >
                                            <div
                                                className={`${styles.postDivContainer}`}
                                            >
                                                <span
                                                    ref={composePostRef}
                                                    className={`${styles.composePostDiv}`}
                                                    contentEditable="true"
                                                    data-placeholder="What's on your mind?"
                                                    data-cy="composePostDiv"
                                                    onInput={(e) =>
                                                        handleInput(
                                                            e,
                                                            postCharLimit,
                                                            attachments,
                                                            setPostingAllowed,
                                                            setCharsLeft
                                                        )
                                                    }
                                                    onPaste={(e) =>
                                                        handlePaste(
                                                            e,
                                                            postCharLimit,
                                                            charsLeft,
                                                            setCharsLeft,
                                                            setPostingAllowed,
                                                            previewImages,
                                                            setPreviewImages,
                                                            attachments,
                                                            setAttachments,
                                                            toast
                                                        )
                                                    }
                                                    onKeyDown={(e) =>
                                                        handleKeyDown(
                                                            e,
                                                            composePostRef,
                                                            handleClick
                                                        )
                                                    }
                                                ></span>
                                                <div
                                                    className={`flex ${styles.composePostOptions}`}
                                                >
                                                    <div
                                                        className={`${styles.button}`}
                                                    >
                                                        <ImageSquare size="30"></ImageSquare>
                                                        <input
                                                            data-cy="attachmentBtn"
                                                            className={
                                                                styles.fileInput
                                                            }
                                                            onChange={(e) =>
                                                                handleAttachmentChange(
                                                                    e,
                                                                    attachments,
                                                                    setAttachments,
                                                                    previewImages,
                                                                    setPreviewImages,
                                                                    setPostingAllowed,
                                                                    toast
                                                                )
                                                            }
                                                            onClick={(e) => {
                                                                e.currentTarget.value =
                                                                    null;
                                                            }}
                                                            type="file"
                                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                            multiple
                                                        />
                                                    </div>
                                                    <button
                                                        data-cy="sendBtn"
                                                        className={
                                                            styles.button
                                                        }
                                                        disabled={
                                                            postingAllowed
                                                                ? false
                                                                : true
                                                        }
                                                        onClick={handleClick}
                                                    >
                                                        <ArrowElbowRightDown
                                                            size="30"
                                                            opacity={
                                                                postingAllowed
                                                                    ? "1"
                                                                    : "0.3"
                                                            }
                                                        ></ArrowElbowRightDown>
                                                    </button>
                                                </div>
                                            </div>
                                            {previewImages.length != 0 && (
                                                <div
                                                    className={
                                                        styles.attachmentsPreview
                                                    }
                                                >
                                                    {previewImages.map(
                                                        (_attachment, i) => {
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={
                                                                        styles.imageAttachment
                                                                    }
                                                                    style={{
                                                                        backgroundImage: `url('${previewImages[i]}')`,
                                                                    }}
                                                                >
                                                                    <div
                                                                        className={`${styles.imageAttachmentOverlay}`}
                                                                    ></div>
                                                                    <div
                                                                        className={`${styles.imageAttachmentClose}`}
                                                                        onClick={(
                                                                            e
                                                                        ) =>
                                                                            handlePreviewImageClose(
                                                                                e,
                                                                                i,
                                                                                previewImages,
                                                                                setPreviewImages,
                                                                                attachments,
                                                                                setAttachments,
                                                                                composePostRef,
                                                                                setPostingAllowed
                                                                            )
                                                                        }
                                                                    >
                                                                        <X
                                                                            size="16"
                                                                            weight="bold"
                                                                        ></X>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            )}
                                            <div
                                                className={`${
                                                    styles.charLimit
                                                } ${
                                                    charsLeft < 0
                                                        ? styles.charLimitReached
                                                        : ""
                                                }`}
                                                style={{
                                                    width: `${
                                                        ((postCharLimit -
                                                            charsLeft) *
                                                            100) /
                                                        postCharLimit
                                                    }%`,
                                                }}
                                            ></div>
                                            <div
                                                className={`${
                                                    styles.progressBar
                                                } ${
                                                    nowPosting
                                                        ? styles.progressBarInProgress
                                                        : ""
                                                }`}
                                            ></div>
                                        </div>
                                        {mobileCompose ? (
                                            <div
                                                className={
                                                    styles.composePostButtonsMobile
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.buttonMobile
                                                    }
                                                >
                                                    <ImageSquare size="36"></ImageSquare>
                                                    <input
                                                        className={
                                                            styles.fileInputMobile
                                                        }
                                                        onChange={(e) =>
                                                            handleAttachmentChange(
                                                                e,
                                                                attachments,
                                                                setAttachments,
                                                                previewImages,
                                                                setPreviewImages,
                                                                setPostingAllowed,
                                                                toast
                                                            )
                                                        }
                                                        onClick={(e) =>
                                                            (e.currentTarget.value =
                                                                null)
                                                        }
                                                        type="file"
                                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                        multiple
                                                    />
                                                </div>
                                                <button
                                                    className={
                                                        styles.buttonMobile
                                                    }
                                                    disabled={
                                                        postingAllowed
                                                            ? false
                                                            : true
                                                    }
                                                    onClick={handleClick}
                                                >
                                                    <PaperPlaneRight
                                                        size="36"
                                                        opacity={
                                                            postingAllowed
                                                                ? "1"
                                                                : "0.3"
                                                        }
                                                    ></PaperPlaneRight>
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div data-cy="postsList" className={`text-white ${styles.posts}`}>
                                    <Virtuoso
                                        totalCount={posts?.current.length}
                                        data={posts.current}
                                        endReached={loadMorePosts}
                                        useWindowScroll
                                        overscan={{ main: 500, reverse: 500 }}
                                        components={{
                                            // eslint-disable-next-line react/display-name
                                            Footer: () => {
                                                return (
                                                    <>
                                                        {!reachedEnd && (
                                                            <div
                                                                className={
                                                                    styles.loadingContainer
                                                                }
                                                            >
                                                                <Loading
                                                                    height="50"
                                                                    width="50"
                                                                ></Loading>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            },
                                        }}
                                        itemContent={(_index, post) => (
                                            <Post
                                                key={post.id}
                                                post={post}
                                                currentUser={user}
                                                handleMediaClick={
                                                    handleMediaClick
                                                }
                                            ></Post>
                                        )}
                                    ></Virtuoso>
                                </div>
                            </div>
                            <div className={styles.rightSide}>trending</div>
                        </div>
                    </div>
                    <div
                        ref={composePostButtonMobileRef}
                        className={`text-white flex justify-content-center align-items-center ${
                            mobileCompose
                                ? styles.composePostMobileButtonActive
                                : ""
                        } ${styles.composePostMobileButton}`}
                        onClick={() => {
                            setMobileCompose(!mobileCompose);
                        }}
                    >
                        <PenNibStraight size="30"></PenNibStraight>
                    </div>
                    {mediaModal && (
                        <MediaModal
                            modalData={modalData}
                            handleMediaClick={handleMediaClick}
                        ></MediaModal>
                    )}
                </>
            ) : null}
        </>
    );
}
