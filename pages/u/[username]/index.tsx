/* eslint-disable react/react-in-jsx-scope */
import axios from "axios";
import axiosInstance from "../../../src/axios";
import { useRouter } from "next/router";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import Loading from "../../../components/loading";
import NavbarLoggedIn from "../../../components/navbarLoggedIn";
import NavbarLoggedOut from "../../../components/navbarLoggedOut";
import { useUser } from "../../../src/hooks/useUser";
import StatusBar from "../../../components/statusBar";
import styles from "../../../styles/profilePage.module.scss";
import Post from "../../../components/post/post";
import {
    formatBigNumbers,
    formatBirthday,
    formatJoinDate,
} from "../../../src/utils/functions";
import MediaModal from "../../../components/mediaModal/mediaModal";
import { Calendar, ChatTeardropText, Gift, Note } from "phosphor-react";
import { useToastContext } from "../../../src/contexts/toastContext";
import { socket } from "src/hooks/useSocket";
import { IUser, IPost } from "../../../src/types/general";
import { LikePayload } from "src/types/utils";
import { GetServerSidePropsContext } from "next";
import { ProfileProps } from "src/types/props";
import { NextSeo } from "next-seo";
import useScrollRestoration from "src/hooks/useScrollRestoration";

export default function Profile(props: ProfileProps): ReactElement {
    enum Tabs {
        Posts = 1,
        PostsAndComments,
        MediaPosts,
    }

    const router = useRouter();
    useScrollRestoration(router);

    const toast = useToastContext();

    const parentContainerRef = useRef(null);

    const [notFound, setNotFound] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<Array<IPost>>([]);
    const [postsAndComments, setPostsAndComments] = useState<Array<IPost>>([]);
    const [mediaPosts, setMediaPosts] = useState<Array<IPost>>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [modalData, setModalData] = useState({
        post: null as IPost,
        imageIndex: 0,
        currentUser: null as IUser,
    });
    const [mediaModal, setMediaModal] = useState(false);
    const [activeTab, setActiveTab] = useState(Tabs.Posts);
    const [user, setUser] = useState<IUser>(props.user);

    let currentUser: IUser = null;
    currentUser = useUser();

    const handleMediaClick = (
        _e: React.MouseEvent<HTMLElement, MouseEvent>,
        post: IPost,
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

    const handlePostsTabClick = () => {
        setActiveTab(Tabs.Posts);
    };

    const handleAllTabClick = () => {
        setActiveTab(Tabs.PostsAndComments);
    };

    const handleMediaTabClick = () => {
        setActiveTab(Tabs.MediaPosts);
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
                            post.likeUsers = post.likeUsers.concat(
                                currentUser._id
                            );
                        } else if (payload.likeType == "UNLIKE") {
                            post.likeUsers = post.likeUsers.filter(
                                (_user) => _user != currentUser._id
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
        if (socket?.connected) {
            socket.on("commentToClient", handleComment);
            socket.on("deletePost", handleCommentDelete);
            socket.on("likeToClient", handleLike);
        }

        return () => {
            if (socket?.connected) {
                socket.off("commentToClient", handleComment);
                socket.off("deletePost", handleCommentDelete);
                socket.off("likeToClient", handleLike);
            }
        };
    }, [handleComment, handleCommentDelete, handleLike]);

    useEffect(() => {
        if (props.user) {
            setNotFound(false);
            setLoading(false);
            axios
                .get(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/posts/getPosts/${props.user._id}`,
                    { withCredentials: true }
                )
                .then((res) => {
                    setPosts(res.data.posts.filter((post: IPost) => post.replyingTo.length == 0));
                    setPostsAndComments(res.data.posts);
                    setMediaPosts(res.data.posts.filter((post: IPost) => post.attachments.length != 0));
                    setPostsLoading(false);
                });
        } else {
            setNotFound(true);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (props.user && user?._id != props.user._id) {
            setUser(props.user);
            setPostsLoading(true);
            setPosts([]);
            setPostsAndComments([]);
            setMediaPosts([]);
            setLoading(false);
            setNotFound(false);
            axios
                .get(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/posts/getPosts/${props.user._id}`,
                    { withCredentials: true }
                )
                .then((res) => {
                    setPosts(res.data.posts.filter((post: IPost) => post.replyingTo.length == 0));
                    setPostsAndComments(res.data.posts);
                    setMediaPosts(res.data.posts.filter((post: IPost) => post.attachments.length != 0));
                    setPostsLoading(false);
                });
        }
        if (!props.user) {
            setUser(null);
            setNotFound(true);
            setLoading(false);
        }
    }, [user, props.user]);

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
            <NextSeo
                title={
                    props.user
                        ? `${props.user.display_name} (@${props.user.username})`
                        : "Profile - Twatter"
                }
                description={props.user?.bio}
                openGraph={{
                    title: props.user
                        ? `${props.user.display_name} (@${props.user.username})`
                        : "Profile - Twatter",
                    description: props.user?.bio,
                    url: `https://twatter.illusionman1212.me/u/${props.user?.username}`,
                    type: "profile",
                    profile: {
                        username: props.user?.username,
                    },
                    images: [
                        {
                            url: props.user?.profile_image,
                        },
                    ],
                }}
            />
            {!loading ? (
                <>
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
                                <div
                                    ref={parentContainerRef}
                                    className={`${styles.container}`}
                                >
                                    <div className={styles.scrollableArea}>
                                        <div className={styles.user}>
                                            <div className={styles.userInfo}>
                                                <div
                                                    className={`round ${styles.userImage}`}
                                                    style={{
                                                        backgroundImage: `url("${
                                                            user
                                                                .profile_image ==
                                                            "default_profile.svg"
                                                                ? "/"
                                                                : ""
                                                        }${
                                                            user
                                                                .profile_image
                                                        }")`,
                                                    }}
                                                ></div>
                                                <div>
                                                    <p
                                                        className={`${styles.display_name} text-bold`}
                                                    >
                                                        {
                                                            user
                                                                .display_name
                                                        }
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
                                                user._id ? (
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
                                                    ) : (
                                                        <div
                                                            className={
                                                                styles.followButton
                                                            }
                                                        >
                                                        Edit Profile
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
                                                                postsAndComments.length
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
                                                <div className="flex gap-1">
                                                    <Note
                                                        className={styles.icon}
                                                        size="32"
                                                    ></Note>
                                                    <p className="mt-1Percent">
                                                        {user.bio}
                                                    </p>
                                                </div>
                                            )}
                                            {user.birthday && (
                                                <div className="flex gap-1">
                                                    <Gift
                                                        className={styles.icon}
                                                        size="32"
                                                    ></Gift>
                                                    <p className="mt-1Percent">
                                                        {formatBirthday(
                                                            user.birthday
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="flex gap-1">
                                                <Calendar
                                                    className={styles.icon}
                                                    size="32"
                                                ></Calendar>
                                                <p className="mt-1Percent">
                                                    Member since{" "}
                                                    {formatJoinDate(
                                                        user.createdAt
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={styles.userPosts}>
                                            <div className={styles.tabs}>
                                                <div
                                                    className={`pointer ${
                                                        styles.postsTab
                                                    } ${
                                                        activeTab ==
                                                            Tabs.Posts &&
                                                        styles.activeTab
                                                    }`}
                                                    onClick={
                                                        handlePostsTabClick
                                                    }
                                                >
                                                    Posts
                                                </div>
                                                <div
                                                    className={`pointer ${
                                                        styles.postsAndCommentsTab
                                                    } ${
                                                        activeTab ==
                                                            Tabs.PostsAndComments &&
                                                        styles.activeTab
                                                    }`}
                                                    onClick={handleAllTabClick}
                                                >
                                                    Posts &amp; Comments
                                                </div>
                                                <div
                                                    className={`pointer ${
                                                        styles.mediaTab
                                                    } ${
                                                        activeTab ==
                                                            Tabs.MediaPosts &&
                                                        styles.activeTab
                                                    }`}
                                                    onClick={
                                                        handleMediaTabClick
                                                    }
                                                >
                                                    Media
                                                </div>
                                            </div>
                                            {!postsLoading ? (
                                                <>
                                                    {(activeTab == Tabs.Posts ? 
                                                        posts : activeTab == Tabs.PostsAndComments ? 
                                                            postsAndComments : mediaPosts).map((post) => {
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
                                                                parentContainerRef={
                                                                    parentContainerRef
                                                                }
                                                            ></Post>
                                                        );
                                                    })}
                                                    {(activeTab == Tabs.Posts ?
                                                        posts : activeTab == Tabs.PostsAndComments ?
                                                            postsAndComments : mediaPosts).length == 0 && (
                                                        <div className="flex justify-content-center" style={{padding: "20px"}}>
                                                            <p>@{user.username} doesn&apos;t have any posts under this tab.</p>
                                                        </div>
                                                    )}
                                                </>
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

export async function getServerSideProps(
    context: GetServerSidePropsContext
): Promise<any> {
    let res = null;
    let user = null;

    try {
        res = await axios.get(
            `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/users/getUserData?username=${context.params.username}`,
            { withCredentials: true }
        );
        user = res.data.user;
    } catch (err) {
        console.error(err);
    }

    return {
        props: { user: user },
    };
}
