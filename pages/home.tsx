/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "../components/statusBar";
import Head from "next/head";
import { useUser } from "../src/hooks/useUserHook";
import Loading from "../components/loading";
import NavbarLoggedIn from "../components/navbarLoggedIn";
import styles from "../styles/home.module.scss";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowElbowRightDown,
    ImageSquare,
    PaperPlaneRight,
    PenNib,
    X,
} from "phosphor-react";
import Post from "../components/post";
import axiosInstance from "../src/axios";
import { useToastContext } from "../src/contexts/toastContext";
import MediaModal from "../components/mediaModal";
import Router from "next/router";
import { connectSocket, socket } from "../src/socket";
import { Attachment, Post as PostType, User } from "src/types/general";
import {
    handleChange,
    handleInput,
    handleKeyDown,
    handlePaste,
    handlePreviewImageClose,
    handleTextInput,
} from "src/utils/eventHandlers";
import { postCharLimit } from "src/utils/variables";
import axios from "axios";

export default function Home(): ReactElement {
    const user = useUser("/login", null);

    const composePostRef = useRef(null);
    const composePostButtonMobileRef = useRef(null);

    const toast = useToastContext();

    const [postingAllowed, setPostingAllowed] = useState(false);
    const [charsLeft, setCharsLeft] = useState(postCharLimit);
    const [mobileCompose, setMobileCompose] = useState(false);
    const [posts, setPosts] = useState([]);
    const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const [previewImages, setPreviewImages] = useState<Array<string>>([]);
    const [nowPosting, setNowPosting] = useState(false);
    const [mediaModal, setMediaModal] = useState(false);
    const [modalData, setModalData] = useState({
        post: null as PostType,
        imageIndex: 0,
        currentUser: null as User,
    });
    const [touchY, setTouchY] = useState(null);

    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
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
        const payload = {
            content: content,
            author: user,
            attachments: attachments,
        };
        composePostRef.current.textContent = "";
        setAttachments([]);
        setPreviewImages([]);
        setPostingAllowed(false);
        setCharsLeft(postCharLimit);
        if (socket) {
            socket?.emit("post", payload);
        } else {
            console.log("socket not connected, trying to connect");
            connectSocket(user.token);
            socket?.emit("post", payload);
        }
    };

    const handleMediaClick = (
        _e: React.MouseEvent<HTMLElement, MouseEvent>,
        post: PostType,
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

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.targetTouches[0]?.clientY - touchY > 0) {
            e.currentTarget.style.top = `${
                e.targetTouches[0]?.clientY - touchY
            }px`;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.changedTouches[0]?.clientY > touchY + 200) {
            setMobileCompose(false);
        }
        e.currentTarget.style.top = "0";
    };

    const handlePost = useCallback(
        (post) => {
            toast("Posted Successfully", 3000);
            setNowPosting(false);
            setMobileCompose(false);
    
            setPosts([post].concat(posts));
        },
        [posts]
    );

    const handleDeletePost = useCallback(
        (postId) => {
            setPosts(posts?.filter((post) => post._id != postId));
        },
        [posts]
    );

    const handleComment = useCallback(
        (comment) => {
            setPosts(
                posts.map((post) => {
                    if (post._id == comment.replyingTo) {
                        post.comments.length < 4 && post.comments.push(comment);
                        return post;
                    }
                    return post;
                })
            );
        },
        [posts]
    );

    useEffect(() => {
        socket?.on("post", handlePost);
        socket?.on("deletePost", handleDeletePost);
        socket?.on("commentToClient", handleComment);

        return () => {
            socket?.off("post", handlePost);
            socket?.off("deletePost", handleDeletePost);
            socket?.off("commentToClient", handleComment);
        };
    }, [socket, handlePost, handleDeletePost, handleComment]);

    useEffect(() => {
        const cancelToken = axios.CancelToken;
        const tokenSource = cancelToken.source();
        axiosInstance
            .get("posts/getPosts", { cancelToken: tokenSource.token })
            .then((res) => {
                setPosts(res.data.posts);
            })
            .catch((err) => {
                if (axios.isCancel(err)) {
                    console.log("Request canceled");
                } else {
                    console.error(err);
                }
            });
        return () => {
            tokenSource.cancel();
        };
    }, []);

    useEffect(() => {
        if (composePostRef?.current) {
            composePostRef.current.addEventListener(
                "textInput",
                handleTextInput as never
            );
        }

        // on browser back button press, close the media modal
        window.onpopstate = () => {
            setMediaModal(false);
        };

        return () => {
            if (composePostRef?.current) {
                composePostRef.current.removeEventListener(
                    "textInput",
                    handleTextInput as never
                );
            }
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
    }, [mobileCompose, mediaModal]);

    useEffect(() => {
        if (!user?.finished_setup) {
            Router.push("/register/setting-up");
        }
    }, [user]);

    return (
        <>
            <Head>
                <title>Home - Twatter</title>
                {/* TODO: write meta tags and other important head tags */}
            </Head>
            {user && user.finished_setup ? (
                <>
                    <NavbarLoggedIn
                        setMediaModal={setMediaModal}
                        user={user}
                    ></NavbarLoggedIn>
                    <div className="feed">
                        <StatusBar title="Home" user={user}></StatusBar>
                        <div
                            className={
                                mobileCompose ? styles.inputContainer : ""
                            }
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* 75px is the height of the navbar on mobile */}
                            <div
                                style={{ minHeight: "calc(50% - 75px)" }}
                                onClick={() => setMobileCompose(false)}
                            ></div>
                            <div
                                className={`flex mx-auto my-2Percent ${
                                    styles.composePost
                                } ${
                                    mobileCompose
                                        ? styles.composePostMobile
                                        : ""
                                }`}
                            >
                                <div className={`${styles.postDivContainer}`}>
                                    <span
                                        ref={composePostRef}
                                        className={`${styles.composePostDiv}`}
                                        contentEditable="true"
                                        data-placeholder="What's on your mind?"
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
                                        <div className={`${styles.button}`}>
                                            <ImageSquare size="30"></ImageSquare>
                                            <input
                                                className={styles.fileInput}
                                                onChange={(e) =>
                                                    handleChange(
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
                                                postingAllowed ? false : true
                                            }
                                            onClick={handleClick}
                                        >
                                            <ArrowElbowRightDown
                                                size="30"
                                                opacity={
                                                    postingAllowed ? "1" : "0.3"
                                                }
                                            ></ArrowElbowRightDown>
                                        </button>
                                    </div>
                                </div>
                                {previewImages.length != 0 && (
                                    <div className={styles.attachmentsPreview}>
                                        {previewImages.map((_attachment, i) => {
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
                                                        onClick={(e) =>
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
                                        })}
                                    </div>
                                )}
                                <div
                                    className={`${styles.charLimit} ${
                                        charsLeft < 0
                                            ? styles.charLimitReached
                                            : ""
                                    }`}
                                    style={{
                                        width: `${
                                            ((postCharLimit - charsLeft) * 100) /
                                            postCharLimit
                                        }%`,
                                    }}
                                ></div>
                                <div
                                    className={`${styles.progressBar} ${
                                        nowPosting
                                            ? styles.progressBarInProgress
                                            : ""
                                    }`}
                                ></div>
                            </div>
                            {mobileCompose ? (
                                <div
                                    className={styles.composePostButtonsMobile}
                                >
                                    <div className={styles.buttonMobile}>
                                        <ImageSquare size="36"></ImageSquare>
                                        <input
                                            className={styles.fileInputMobile}
                                            onChange={(e) =>
                                                handleChange(
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
                                                (e.currentTarget.value = null)
                                            }
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                            multiple
                                        />
                                    </div>
                                    <button
                                        className={styles.buttonMobile}
                                        disabled={postingAllowed ? false : true}
                                        onClick={handleClick}
                                    >
                                        <PaperPlaneRight
                                            size="36"
                                            opacity={
                                                postingAllowed ? "1" : "0.3"
                                            }
                                        ></PaperPlaneRight>
                                    </button>
                                </div>
                            ) : null}
                        </div>
                        <div className={`text-white ${styles.posts}`}>
                            {posts &&
                                posts.map((post) => {
                                    return (
                                        <Post
                                            key={post._id}
                                            post={post}
                                            currentUser={user}
                                            handleMediaClick={handleMediaClick}
                                        ></Post>
                                    );
                                })}
                            <div className={styles.loadingContainer}>
                                <Loading height="50" width="50"></Loading>
                            </div>
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
                        <PenNib size="30"></PenNib>
                    </div>
                    {mediaModal && (
                        <MediaModal modalData={modalData}></MediaModal>
                    )}
                </>
            ) : (
                <>
                    <Loading height="100" width="100"></Loading>
                </>
            )}
        </>
    );
}
