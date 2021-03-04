/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "../components/statusBar";
import Head from "next/head";
import { useUser } from "../src/hooks/useUserHook";
import Loading from "../components/loading";
import NavbarLoggedIn from "../components/navbarLoggedIn";
import styles from "../styles/home.module.scss";
import { FormEvent, ReactElement, useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowElbowRightDown,
    ImageSquare,
    PaperPlaneRight,
    PenNib,
    X,
} from "phosphor-react";
import Post from "../components/post";
import axios from "../src/utils/axios";
import { useToastContext } from "../src/contexts/toastContext";
import MediaModal from "../components/mediaModal";
import Router from "next/router";
import { connectSocket, socket } from "../src/contexts/socket";

export default function Home(): ReactElement {
    const charLimit = 128;
    const maxAttachments = 4;

    const user = useUser("/login", null);

    const composePostRef = useRef(null);
    const composePostButtonMobileRef = useRef(null);

    const toast = useToastContext();

    const [postingAllowed, setPostingAllowed] = useState(false);
    const [charsLeft, setCharsLeft] = useState(charLimit);
    const [mobileCompose, setMobileCompose] = useState(false);
    const [posts, setPosts] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [nowPosting, setNowPosting] = useState(false);
    const [mediaModal, setMediaModal] = useState(false);
    const [modalData, setModalData] = useState({
        post: {
            content: "",
            attachments: [],
            createdAt: null,
            likeUsers: [],
            _id: "",
            author: {
                _id: "",
                display_name: "",
                profile_image: "",
            },
        },
        imageIndex: 0,
        currentUser: null,
    });
    const [touchY, setTouchY] = useState(null);

    const handleInput = (e: FormEvent<HTMLInputElement>) => {
        if ((e.target as HTMLElement).textContent.trim().length > charLimit) {
            setPostingAllowed(false);
        } else if (
            (e.target as HTMLElement).textContent.trim().length != 0 ||
            attachments.length
        ) {
            setPostingAllowed(true);
        } else {
            setPostingAllowed(false);
        }
        setCharsLeft(charLimit - (e.target as HTMLElement).textContent.trim().length);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (e.key == "Enter") {
            e.preventDefault();

            if (!composePostRef.current.textContent.length) return;

            document.execCommand("insertLineBreak");

            e.ctrlKey && handleClick(e as unknown as React.MouseEvent<HTMLElement, MouseEvent>);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
        e.preventDefault();
        // handle pasting strings as plain text
        if (e.clipboardData.items.length && e.clipboardData.items[0].kind == "string") {
            const text = e.clipboardData.getData("text/plain");
            (e.target as HTMLElement).textContent += text;
    
            if ((e.target as HTMLElement).textContent.length > charLimit) {
                setPostingAllowed(false);
            } else if ((e.target as HTMLElement).textContent.length) {
                setPostingAllowed(true);
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
                setPostingAllowed(true);
            }
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (!postingAllowed) {
            e.preventDefault();
            return;
        }
        if (composePostRef.current.textContent.trim().length > charLimit) {
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
        const content = composePostRef.current.innerText.replace(/(\n){2,}/g, "\n\n").trim();
        const payload = {
            content: content,
            author: user,
            attachments: attachments,
        };
        composePostRef.current.textContent = "";
        setAttachments([]);
        setPreviewImages([]);
        setPostingAllowed(false);
        setCharsLeft(charLimit);
        if (socket) {
            socket?.emit("post", payload);
        } else {
            console.log("socket not connected, trying to connect");
            connectSocket(user.token);
            socket?.emit("post", payload);
        }
        toast("Posted Successfully", 3000);
        setNowPosting(false);
        setMobileCompose(false);
    };

    const handleMediaClick = (_e: React.MouseEvent<HTMLElement, MouseEvent>, post: any, index: number) => {
        setModalData({
            post: post,
            imageIndex: index,
            currentUser: user,
        });
        setMediaModal(true);
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
            setPostingAllowed(true);
            setPreviewImages(validPreviewImages);
            setAttachments(validFiles);
        }
        // TODO: videos
    };

    const handleImagePreviewClick = (_e: React.MouseEvent<HTMLElement, MouseEvent>, i: number) => {
        const tempPreviewImages = [...previewImages];
        tempPreviewImages.splice(i, 1);
        setPreviewImages(tempPreviewImages);
        const tempAttachments = [...attachments];
        tempAttachments.splice(i, 1);
        setAttachments(tempAttachments);
        // if there're no attachments AND no text, disable the posting button
        if (
            !tempAttachments.length &&
            !composePostRef.current.textContent.trim().length
        ) {
            setPostingAllowed(false);
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

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        setTouchY(e.targetTouches[0]?.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.targetTouches[0]?.clientY - touchY > 0) {
            e.currentTarget.style.top = `${e.targetTouches[0]?.clientY - touchY}px`;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.changedTouches[0]?.clientY > (touchY + 200)) {
            setMobileCompose(false);
        }
        e.currentTarget.style.top = "0";
    };

    const handlePost = useCallback((post) => {
        setPosts([post].concat(posts));
    }, [posts]);

    const handleDeletePost = useCallback((postId) => {
        setPosts(posts?.filter(post => post._id != postId));
    }, [posts]);

    const handleComment = useCallback((comment) => {
        setPosts(posts.map(post => {
            if (post._id == comment.replyingTo) {
                post.comments.length < 4 && post.comments.push(comment);
                return post;
            }
            return post;
        }));
    }, [posts]);

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
        axios
            .get("posts/getPosts")
            .then((res) => {
                setPosts(res.data.posts);
            })
            .catch((err) => {
                console.error(err);
            });
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
                                        onInput={handleInput}
                                        onPaste={handlePaste}
                                        onKeyDown={handleKeyDown}
                                    ></span>
                                    <div
                                        className={`flex ${styles.composePostOptions}`}
                                    >
                                        <div className={`${styles.button}`}>
                                            <ImageSquare size="30"></ImageSquare>
                                            <input
                                                className={styles.fileInput}
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
                                                            handleImagePreviewClick(
                                                                e,
                                                                i
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
                                            ((charLimit - charsLeft) * 100) /
                                            charLimit
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
                                            onChange={handleChange}
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
