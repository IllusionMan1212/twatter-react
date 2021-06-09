/* eslint-disable react/react-in-jsx-scope */
import axios from "axios";
import axiosInstance from "../../../src/axios";
import { useRouter } from "next/router";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import Loading from "../../../components/loading";
import Navbar from "../../../components/navbar";
import StatusBarLoggedOut from "../../../components/statusBarLoggedOut";
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
import { ButtonType, ProfileProps } from "src/types/props";
import { NextSeo } from "next-seo";
import useScrollRestoration from "src/hooks/useScrollRestoration";
import SuggestedUsers from "components/suggestedUsers/suggestedUsers";
import Button from "components/buttons/button";
import EditProfilePopup from "components/editProfilePopup";
import { Virtuoso } from "react-virtuoso";
import useLatestState from "src/hooks/useLatestState";

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
    const postsPageRef = useRef(null);
    const commentsPageRef = useRef(null);
    const mediaPageRef = useRef(null);
    const activeTabRef = useRef(null);

    const [notFound, setNotFound] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useLatestState<Array<IPost>>([]);
    const [postsAndComments, setPostsAndComments] = useLatestState<Array<IPost>>([]);
    const [mediaPosts, setMediaPosts] = useLatestState<Array<IPost>>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [modalData, setModalData] = useState({
        post: null as IPost,
        imageIndex: 0,
        currentUser: null as IUser,
    });
    const [mediaModal, setMediaModal] = useState(false);
    const [activeTab, setActiveTab] = useState(Tabs.Posts);
    const [user, setUser] = useState<IUser>(props.user);
    const [editProfilePopup, setEditProfilePopup] = useState(false);
    const [postsReachedEnd, setPostsReachedEnd] = useState(false);
    const [commentsReachedEnd, setCommentsReachedEnd] = useState(false);
    const [mediaReachedEnd, setMediaReachedEnd] = useState(false);
    const [postsPage, setPostsPage] = useState(0);
    const [commentsPage, setCommentsPage] = useState(0);
    const [mediaPage, setMediaPage] = useState(0);
    const [postsCount, setPostsCount] = useState(0);

    postsPageRef.current = postsPage;
    commentsPageRef.current = commentsPage;
    mediaPageRef.current = mediaPage;
    activeTabRef.current = activeTab;

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

    const handleFollowClick = () => {
        toast("Coming Soon™", 3000);
    };

    const handlePostsTabClick = () => {
        setActiveTab(Tabs.Posts);
        activeTabRef.current = Tabs.Posts;
    };

    const handleAllTabClick = () => {
        setActiveTab(Tabs.PostsAndComments);
        activeTabRef.current = Tabs.PostsAndComments;
        if (!postsAndComments.current.length && !commentsReachedEnd) {
            getPosts(commentsPageRef.current, "comments").then((newPosts) => {
                if (newPosts.length < 50) {
                    setCommentsReachedEnd(true);
                }
                setPostsAndComments(newPosts);
            });
        }
    };

    const handleMediaTabClick = () => {
        setActiveTab(Tabs.MediaPosts);
        activeTabRef.current = Tabs.MediaPosts;
        if (!mediaPosts.current.length && !mediaReachedEnd) {
            getPosts(mediaPageRef.current, "media").then((newPosts) => {
                if (newPosts.length < 50) {
                    setMediaReachedEnd(true);
                }
                setMediaPosts(newPosts);
            });
        }
    };

    const getActiveTabPosts = useCallback((): Array<IPost> => {
        switch (activeTabRef.current) {
        case Tabs.Posts:
            return posts.current;
        case Tabs.PostsAndComments:
            return postsAndComments.current;
        case Tabs.MediaPosts:
            return mediaPosts.current;
        }
    }, [mediaPosts, posts, postsAndComments]);

    const setActiveTabPosts = useCallback((posts: Array<IPost>) => {
        switch (activeTabRef.current) {
        case Tabs.Posts:
            setPosts(posts);
            break;
        case Tabs.PostsAndComments:
            setPostsAndComments(posts);
            break;
        case Tabs.MediaPosts:
            setMediaPosts(posts);
            break;
        }
    }, [setMediaPosts, setPosts, setPostsAndComments]);

    const getActiveReachedEnd = (): boolean => {
        switch (activeTabRef.current) {
        case Tabs.Posts:
            return postsReachedEnd;
        case Tabs.PostsAndComments:
            return commentsReachedEnd;
        case Tabs.MediaPosts:
            return mediaReachedEnd;
        }
    };

    // this is for the mediamodal
    // TODO: handle the edge case where a comment is also a regular post in the active tab
    const handleComment = useCallback(
        (comment) => {
            setPostsCount(postsCount + 1);
            getActiveTabPosts().map((post) => {
                if (post._id == comment.replyingTo) {
                    post.comments.push(comment._id);
                    post.numberOfComments++;
                    return post;
                }
                return post;
            });
        },
        [getActiveTabPosts, postsCount]
    );

    // this is for the mediamodal
    // TODO: handle the edge case where a comment is also a regular post in the active tab
    const handleCommentDelete = useCallback(
        (commentId) => {
            setPostsCount(postsCount - 1);
            // check if the id is a post id and remove the post
            if (
                getActiveTabPosts().some((post) => {
                    return post._id == commentId;
                })
            ) {
                setActiveTabPosts(getActiveTabPosts().filter((post) => post._id != commentId));
            // check if the id is a comment id and decrement the comment counter
            } else {
                setActiveTabPosts(getActiveTabPosts().map((post) => {
                    post.comments.map((comment) => {
                        if (comment == commentId) {
                            post.numberOfComments--;
                            return comment;
                        }
                        return comment;
                    });
                    return post;
                }));
            }
        },
        [getActiveTabPosts, postsCount, setActiveTabPosts]
    );

    const handleLike = useCallback(
        (payload: LikePayload) => {
            setPosts(posts.current.map((post) => {
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
            }));
            setPostsAndComments(postsAndComments.current.map((post) => {
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
            }));
            setMediaPosts(mediaPosts.current.map((post) => {
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
            }));
        },
        [currentUser?._id, mediaPosts, posts, postsAndComments, setMediaPosts, setPosts, setPostsAndComments]
    );

    const handleBirthdayRemoved = useCallback(
        (userId) => {
            if (currentUser?._id == userId && userId == user._id) {
                setUser({ ...user, birthday: null });
            }
        },
        [currentUser?._id, user]
    );

    // this also needs proper change
    const handleUpdatedProfile = useCallback(
        (payload) => {
            if (currentUser?._id == payload.userId && payload.userId == user._id) {
                let profile_image: string = null;
                if (payload.profileImage) {
                    profile_image = payload.profileImage;
                    getActiveTabPosts().map((post) => {
                        post.author.profile_image = profile_image;
                        return post;
                    });
                    currentUser.profile_image = profile_image;
                }
                setUser({
                    ...user,
                    display_name: payload.displayName,
                    bio: payload.bio,
                    birthday: payload.birthday ?? user.birthday,
                    profile_image: profile_image ?? user.profile_image
                });
            }
        },
        [currentUser, user, getActiveTabPosts]
    );

    const getPosts = useCallback((page: number, postsType: string): Promise<any> => {
        return axios
            .get(
                `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/posts/getPosts/${page}/${props.user._id}?type=${postsType}`,
                { withCredentials: true }
            )
            .then((res) => {
                return res.data.posts;
            });
    }, [props.user._id]);

    const getPostsCount = useCallback((): Promise<any> => {
        return axios
            .get(
                `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/posts/getPostsCount/${props.user._id}`,
                { withCredentials: true }
            )
            .then((res) => {
                return res.data.postsCount;
            });
    }, [props.user._id]);

    const loadMorePosts = (lastItemIndex: number) => {
        
        switch (activeTab) {
        case Tabs.Posts:
            // if we have less than 50 items in the array, then we dont need to load more items cuz we are already at the end
            if (lastItemIndex < 49) {
                setPostsReachedEnd(true);
                return;
            }
            setPostsPage(postsPageRef.current + 1);
            getPosts(postsPageRef.current, "posts").then((newPosts) => {
                if (!newPosts.length) {
                    setPostsReachedEnd(true);
                    return;
                }
                setPosts(posts.current.concat(newPosts));
            });
            break;
        case Tabs.PostsAndComments:
            // if we have less than 50 items in the array, then we dont need to load more items cuz we are already at the end
            if (lastItemIndex < 49) {
                setCommentsReachedEnd(true);
                return;
            }
            setCommentsPage(commentsPageRef.current + 1);
            getPosts(commentsPageRef.current, "comments").then((newPosts) => {
                if (!newPosts.length) {
                    setCommentsReachedEnd(true);
                    return;
                }
                setPostsAndComments(postsAndComments.current.concat(newPosts));
            });
            break;
        case Tabs.MediaPosts:
            // if we have less than 50 items in the array, then we dont need to load more items cuz we are already at the end
            if (lastItemIndex < 49) {
                setMediaReachedEnd(true);
                return;
            }
            setMediaPage(mediaPageRef.current + 1);
            getPosts(mediaPageRef.current, "media").then((newPosts) => {
                if (!newPosts.length) {
                    setMediaReachedEnd(true);
                    return;
                }
                setMediaPosts(mediaPosts.current.concat(newPosts));
            });
            break;
        }
    };

    useEffect(() => {
        if (socket?.connected) {
            socket.on("commentToClient", handleComment);
            socket.on("deletePost", handleCommentDelete);
            socket.on("likeToClient", handleLike);
            socket.on("birthdayRemoved", handleBirthdayRemoved);
            socket.on("updatedProfile", handleUpdatedProfile);
        }

        return () => {
            if (socket?.connected) {
                socket.off("commentToClient", handleComment);
                socket.off("deletePost", handleCommentDelete);
                socket.off("likeToClient", handleLike);
                socket.off("birthdayRemoved", handleBirthdayRemoved);
                socket.off("updatedProfile", handleUpdatedProfile);
            }
        };
    }, [handleComment, handleCommentDelete, handleLike, handleBirthdayRemoved, handleUpdatedProfile]);

    useEffect(() => {
        if (props.user) {
            setNotFound(false);
            setLoading(false);
            getPostsCount().then(postsCount => {
                setPostsCount(postsCount);
            });
            getPosts(postsPageRef.current, "posts").then(posts => {
                setPosts(posts);
                setPostsLoading(false);
            });
        } else {
            setNotFound(true);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (props.user && user?._id != props.user._id) {
            setPostsCount(0);
            setActiveTab(Tabs.Posts);
            activeTabRef.current = Tabs.Posts;
            setUser(props.user);
            setPostsLoading(true);
            setPostsReachedEnd(false);
            setCommentsReachedEnd(false);
            setMediaReachedEnd(false);
            setPosts([]);
            setPostsAndComments([]);
            setMediaPosts([]);
            setPostsPage(0);
            setCommentsPage(0);
            setMediaPage(0);
            postsPageRef.current = 0;
            commentsPageRef.current = 0;
            mediaPageRef.current = 0;
            setLoading(false);
            setNotFound(false);

            getPostsCount().then(count => {
                setPostsCount(count);
            });
            getPosts(postsPageRef.current, "posts").then(posts => {
                setPosts(posts);
                setPostsLoading(false);
            });
        }
        if (!props.user) {
            setUser(null);
            setNotFound(true);
            setLoading(false);
        }
    }, [user, props.user, getPosts]);

    useEffect(() => {
        if (mediaModal || editProfilePopup) {
            document.body.classList.add("overflow-hidden");
            document.body.classList.remove("overflow-unset");
        } else {
            document.body.classList.remove("overflow-hidden");
            document.body.classList.add("overflow-unset");
        }
    }, [mediaModal, editProfilePopup]);

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
                                <StatusBar
                                    title={user.display_name}
                                    user={currentUser}
                                ></StatusBar>
                            ) : (
                                <StatusBarLoggedOut></StatusBarLoggedOut>
                            )}
                            <div className={styles.content}>
                                <div className={styles.leftSide}>friends</div>
                                <div className={styles.center}>
                                    <div className="text-white">
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
                                                                    <Button
                                                                        text="Follow"
                                                                        size={10}
                                                                        type={
                                                                            ButtonType.Regular
                                                                        }
                                                                        handleClick={
                                                                            handleFollowClick
                                                                        }
                                                                    ></Button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    text="Edit Profile"
                                                                    size={10}
                                                                    type={
                                                                        ButtonType.Regular
                                                                    }
                                                                    handleClick={() =>
                                                                        setEditProfilePopup(
                                                                            true
                                                                        )
                                                                    }
                                                                ></Button>
                                                            )}
                                                        <div
                                                            className={
                                                                styles.statsContainer
                                                            }
                                                        >
                                                            <span>
                                                                <span className="text-bold">
                                                                    {formatBigNumbers(
                                                                        postsCount
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
                                                <div
                                                    className={
                                                        styles.suggestedUsersMobile
                                                    }
                                                >
                                                    <SuggestedUsers
                                                        users={new Array(3).fill(
                                                            props.user
                                                        )}
                                                    ></SuggestedUsers>
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
                                                            <Virtuoso
                                                                totalCount={getActiveTabPosts().length}
                                                                data={getActiveTabPosts()}
                                                                endReached={loadMorePosts}
                                                                useWindowScroll
                                                                overscan={{ main: 500, reverse: 500 }}
                                                                // eslint-disable-next-line react/display-name
                                                                components={{Footer: () => {
                                                                    return (
                                                                        <>
                                                                            {!getActiveReachedEnd() && (
                                                                                <div className={styles.loadingContainer}>
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
                                                                )}
                                                            ></Virtuoso>
                                                            {getActiveTabPosts().length == 0 && getActiveReachedEnd() && (
                                                                <div
                                                                    className="flex justify-content-center"
                                                                    style={{
                                                                        padding: "20px",
                                                                    }}
                                                                >
                                                                    <p>
                                                                @{user.username}{" "}
                                                                doesn&apos;t
                                                                have any posts
                                                                under this tab.
                                                                    </p>
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
                                </div>
                                <div className={styles.rightSide}>
                                    <div
                                        className={styles.suggestedUsersDesktop}
                                    >
                                        <SuggestedUsers
                                            users={new Array(5).fill(user)}
                                        ></SuggestedUsers>
                                    </div>
                                </div>
                            </div>
                            {currentUser && (
                                <Navbar
                                    user={currentUser}
                                ></Navbar>
                            )}
                            {mediaModal && (
                                <MediaModal
                                    modalData={modalData}
                                    handleMediaClick={handleMediaClick}
                                ></MediaModal>
                            )}
                            {editProfilePopup && (
                                <EditProfilePopup
                                    setEditProfilePopup={setEditProfilePopup}
                                    userData={user}
                                ></EditProfilePopup>
                            )}
                        </>
                    ) : (
                        <>
                            {currentUser ? (
                                <div>
                                    <Navbar
                                        user={currentUser}
                                    ></Navbar>
                                    <StatusBar
                                        title="Not Found"
                                        user={currentUser}
                                    ></StatusBar>
                                </div>
                            ) : (
                                <StatusBarLoggedOut></StatusBarLoggedOut>
                            )}
                            <div className="text-white">
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
