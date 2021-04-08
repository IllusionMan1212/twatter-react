/* eslint-disable react/react-in-jsx-scope */
import axios from "axios";
import axiosInstance from "../../../src/axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { ReactElement, useCallback, useEffect, useState } from "react";
import Loading from "../../../components/loading";
import NavbarLoggedIn from "../../../components/navbarLoggedIn";
import NavbarLoggedOut from "../../../components/navbarLoggedOut";
import { useUser } from "../../../src/hooks/useUserHook";
import StatusBar from "../../../components/statusBar";
import styles from "../../../styles/profilePage.module.scss";
import Post from "../../../components/post/post";
import {
    formatBigNumbers,
    formatBirthday,
    formatJoinDate,
} from "../../../src/utils/functions";
import MediaModal from "../../../components/mediaModal/mediaModal";
import { ChatTeardropText } from "phosphor-react";
import { useToastContext } from "../../../src/contexts/toastContext";
import { socket } from "../../../src/socket";
import { User, Post as PostType } from "../../../src/types/general";
import { LikePayload } from "src/types/utils";

export default function Profile(): ReactElement {
    const router = useRouter();

    const toast = useToastContext();

    const [notFound, setNotFound] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState<Array<PostType>>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [modalData, setModalData] = useState({
        post: null as PostType,
        imageIndex: 0,
        currentUser: null as User,
    });
    const [mediaModal, setMediaModal] = useState(false);

    let currentUser: User = null;
    currentUser = useUser();

    const handleMediaClick = (
        _e: React.MouseEvent<HTMLElement, MouseEvent>,
        post: PostType,
        index: number
    ) => {
        setModalData({
            post: post,
            imageIndex: index,
            currentUser: currentUser,
        });
        setMediaModal(true);
    };

    const handleMessageClick = () => {
        if (!currentUser || currentUser._id == user._id) {
            return;
        }
        const payload = {
            senderId: currentUser._id,
            receiverId: user._id,
        };
        axiosInstance
            .post("/messaging/startConversation", payload)
            .then((res) => {
                router.push(`/messages/${res.data.conversationId}`);
            })
            .catch((err) => {
                toast(
                    err?.response?.data?.message ?? "An error has occurred",
                    5000
                );
            });
    };

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

    const handleCommentDelete = useCallback(
        (commentId) => {
            if (
                posts.some((post) => {
                    return post._id == commentId;
                })
            ) {
                setPosts(posts?.filter((post) => post._id != commentId));
            } else {
                setPosts(
                    posts.map((post) => {
                        post.comments.map((comment) => {
                            if (comment._id == commentId) {
                                post.comments = post.comments.filter(
                                    (comment) => comment._id != commentId
                                );
                                post.numberOfComments--;
                                return comment;
                            }
                            return comment;
                        });
                        return post;
                    })
                );
            }
        },
        [posts]
    );

    const handleLike = useCallback(
        (payload: LikePayload) => {
            setPosts(
                posts.map((post) => {
                    if (post._id == payload.postId) {
                        if (payload.likeType == "LIKE") {
                            post.likeUsers = post.likeUsers.concat(user._id);
                        } else if (payload.likeType == "UNLIKE") {
                            post.likeUsers = post.likeUsers.filter(
                                (_user) => _user != user._id
                            );
                        }
                        return post;
                    }
                    return post;
                })
            );
        },
        [posts]
    );

    useEffect(() => {
        socket?.on("commentToClient", handleComment);
        socket?.on("deletePost", handleCommentDelete);
        socket?.on("likeToClient", handleLike);

        return () => {
            socket?.off("commentToClient", handleComment);
            socket?.off("deletePost", handleCommentDelete);
            socket?.off("likeToClient", handleLike);
        };
    }, [socket, handleComment]);

    useEffect(() => {
        if (router.query.username) {
            axios
                .get(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/users/getUserData?username=${router.query.username}`,
                    { withCredentials: true }
                )
                .then((res) => {
                    setUser(res.data.user);
                    setNotFound(false);
                })
                .catch((err) => {
                    setLoading(false);
                    if (err.response.status == 404) {
                        setNotFound(true);
                    }
                });
        }
    }, [router.query.username]);

    useEffect(() => {
        if (user) {
            setLoading(false);
            axios
                .get(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/posts/getPosts/${user._id}`,
                    { withCredentials: true }
                )
                .then((res) => {
                    setPosts(res.data.posts);
                    setPostsLoading(false);
                });
        }
    }, [user]);

    useEffect(() => {
        if (mediaModal) {
            document.body.classList.add("overflow-hidden");
            document.body.classList.remove("overflow-unset");
        } else {
            document.body.classList.remove("overflow-hidden");
            document.body.classList.add("overflow-unset");
        }
    }, [mediaModal]);

    useEffect(() => {
        // on browser back button press, close the media modal
        window.onpopstate = () => {
            setMediaModal(false);
        };
    });

    return (
        <>
            {!loading ? (
                <>
                    <Head>
                        <title>
                            {user
                                ? `${user.display_name}'s Profile`
                                : "User not found"}{" "}
                            - Twatter
                        </title>
                        <meta
                            property={"og:image"}
                            content={user.profile_image}
                            key="image"
                        />
                        <meta
                            property={"og:url"}
                            content={`https://twatter.illusionman1212.me/u/${user.username}`}
                            key="url"
                        />
                        <meta
                            property={"og:title"}
                            content={`${user.display_name} (@${user.username})`}
                            key="title"
                        />
                        <meta
                            property={"og:description"}
                            content={user.bio}
                            key="description"
                        />
                        <meta
                            property={"og:type"}
                            content={"profile"}
                            key="type"
                        />
                    </Head>
                    {!notFound && user ? (
                        <>
                            {currentUser ? (
                                <div className="feed">
                                    <NavbarLoggedIn
                                        user={currentUser}
                                    ></NavbarLoggedIn>
                                    <StatusBar
                                        title={user.display_name}
                                        user={currentUser}
                                    ></StatusBar>
                                </div>
                            ) : (
                                <NavbarLoggedOut></NavbarLoggedOut>
                            )}
                            <div
                                className={`text-white ${
                                    currentUser && "feed"
                                }`}
                            >
                                <div className={`${styles.container}`}>
                                    <div className={styles.scrollableArea}>
                                        <div className={styles.user}>
                                            <div className={styles.userInfo}>
                                                <div
                                                    className={`round ${styles.userImage}`}
                                                    style={{
                                                        backgroundImage: `url("${
                                                            user.profile_image ==
                                                            "default_profile.svg"
                                                                ? "/"
                                                                : ""
                                                        }${
                                                            user.profile_image
                                                        }")`,
                                                    }}
                                                ></div>
                                                <div>
                                                    <p
                                                        className={`${styles.display_name} text-bold`}
                                                    >
                                                        {user.display_name}
                                                    </p>
                                                    <p
                                                        className={`usernameGrey ${styles.username}`}
                                                    >
                                                        @{user.username}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={styles.userStats}>
                                                {currentUser?._id !=
                                                    user._id && (
                                                    <div
                                                        className={
                                                            styles.userButtons
                                                        }
                                                    >
                                                        {currentUser && (
                                                            <div
                                                                className="pointer"
                                                                onClick={
                                                                    handleMessageClick
                                                                }
                                                            >
                                                                <ChatTeardropText
                                                                    color="#6067FE"
                                                                    size="40"
                                                                    weight="fill"
                                                                ></ChatTeardropText>
                                                            </div>
                                                        )}
                                                        <div
                                                            className={
                                                                styles.followButton
                                                            }
                                                        >
                                                            Follow
                                                        </div>
                                                    </div>
                                                )}
                                                <div
                                                    className={
                                                        styles.statsContainer
                                                    }
                                                >
                                                    <span>
                                                        <span className="text-bold">
                                                            {formatBigNumbers(
                                                                posts.length
                                                            )}
                                                        </span>{" "}
                                                        Posts
                                                    </span>{" "}
                                                    <span>
                                                        <span className="text-bold">
                                                            {formatBigNumbers(
                                                                0
                                                            )}
                                                        </span>{" "}
                                                        Following
                                                    </span>{" "}
                                                    <span>
                                                        <span className="text-bold">
                                                            {formatBigNumbers(
                                                                0
                                                            )}
                                                        </span>{" "}
                                                        Followers
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.userExtraInfo}>
                                            {user.bio && (
                                                <>
                                                    <p
                                                        className={`text-bold ${styles.bioBirthdayTitle}`}
                                                    >
                                                        Bio
                                                    </p>
                                                    <p className="mt-1Percent">
                                                        {user.bio}
                                                    </p>
                                                </>
                                            )}
                                            {user.birthday && (
                                                <>
                                                    <p
                                                        className={`text-bold ${styles.bioBirthdayTitle}`}
                                                    >
                                                        Birthday
                                                    </p>
                                                    <p className="mt-1Percent">
                                                        {formatBirthday(
                                                            user.birthday
                                                        )}
                                                    </p>
                                                </>
                                            )}
                                            <p
                                                className={`text-bold ${styles.bioBirthdayTitle}`}
                                            >
                                                Member Since
                                            </p>
                                            <p className="mt-1Percent">
                                                {formatJoinDate(user.createdAt)}
                                            </p>
                                        </div>
                                        <div className={styles.userPosts}>
                                            {!postsLoading ? (
                                                posts.map((post) => {
                                                    return (
                                                        <Post
                                                            key={post._id}
                                                            currentUser={
                                                                currentUser
                                                            }
                                                            handleMediaClick={
                                                                handleMediaClick
                                                            }
                                                            post={post}
                                                            handleLike={
                                                                handleLike
                                                            }
                                                        ></Post>
                                                    );
                                                })
                                            ) : (
                                                <Loading
                                                    height="50"
                                                    width="50"
                                                ></Loading>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {mediaModal && (
                                <MediaModal
                                    modalData={modalData}
                                    handleMediaClick={handleMediaClick}
                                    handleComment={handleComment}
                                    handleCommentDelete={handleCommentDelete}
                                ></MediaModal>
                            )}
                        </>
                    ) : (
                        <>
                            {currentUser ? (
                                <div className="feed">
                                    <NavbarLoggedIn
                                        user={currentUser}
                                    ></NavbarLoggedIn>
                                    <StatusBar
                                        title="Not Found"
                                        user={currentUser}
                                    ></StatusBar>
                                </div>
                            ) : (
                                <NavbarLoggedOut></NavbarLoggedOut>
                            )}
                            <div
                                className={`text-white ${
                                    currentUser && "feed"
                                }`}
                            >
                                <div className={`${styles.container}`}>
                                    <div className={styles.scrollableArea}>
                                        <div className={styles.user}>
                                            <div className={styles.userInfo}>
                                                <div
                                                    className={`round ${styles.userImage} ${styles.userImageNotFound}`}
                                                ></div>
                                                <div>
                                                    <p
                                                        className={`${styles.display_name} text-bold`}
                                                    >
                                                        User Doesn&apos;t Exist
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`text-medium ${styles.userExtraInfo} ${styles.userExtraInfoNotFound}`}
                                        >
                                            User Not Found
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <Loading height="100" width="100"></Loading>
            )}
        </>
    );
}
