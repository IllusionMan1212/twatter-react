import axios, { AxiosResponse } from "axios";
import axiosInstance from "src/axios";
import { useRouter } from "next/router";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import Loading from "components/loading";
import styles from "styles/profilePage.module.scss";
import Post from "components/post/post";
import {
    formatBigNumbers,
    formatBirthday,
    formatJoinDate,
} from "src/utils/functions";
import MediaModal from "components/mediaModal/mediaModal";
import { Calendar, ChatTeardropText, Gift, Note } from "phosphor-react";
import { useToastContext } from "src/contexts/toastContext";
import { IUser, IPost } from "src/types/general";
import { LikePayload } from "src/types/utils";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { ButtonType, ProfileProps } from "src/types/props";
import { NextSeo } from "next-seo";
import useScrollRestoration from "src/hooks/useScrollRestoration";
import SuggestedUsers from "components/suggestedUsers/suggestedUsers";
import Button from "components/buttons/button";
import EditProfilePopup from "components/editProfilePopup";
import { Virtuoso } from "react-virtuoso";
import useLatestState from "src/hooks/useLatestState";
import { useUserContext } from "src/contexts/userContext";
import Friends from "components/friends/friends";
import DateTime from "components/datetime";
import { useGlobalContext } from "src/contexts/globalContext";

interface ApiRequest {
    senderId: string;
    receiverId: string;
}

interface ApiResponse {
    conversationId: string;
}

export default function Profile(props: ProfileProps): ReactElement {
    const enum Tabs {
        Posts = 1,
        PostsAndComments,
        MediaPosts,
    }

    const router = useRouter();
    useScrollRestoration(router);

    const toast = useToastContext();
    const { user: currentUser, socket } = useUserContext();
    const { setStatusBarTitle } = useGlobalContext();

    const parentContainerRef = useRef(null);

    const [notFound, setNotFound] = useState(null);
    const [posts, setPosts] = useLatestState<Array<IPost>>([]);
    const [postsAndComments, setPostsAndComments] = useLatestState<
        Array<IPost>
    >([]);
    const [mediaPosts, setMediaPosts] = useLatestState<Array<IPost>>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [modalData, setModalData] = useState({
        post: null as IPost,
        imageIndex: 0,
        currentUser: null as IUser,
    });
    const [mediaModal, setMediaModal] = useState(false);
    const [activeTab, setActiveTab] = useLatestState(Tabs.Posts);
    const [user, setUser] = useState<IUser>(props.user);
    const [editProfilePopup, setEditProfilePopup] = useState(false);
    const [postsReachedEnd, setPostsReachedEnd] = useState(false);
    const [commentsReachedEnd, setCommentsReachedEnd] = useState(false);
    const [mediaReachedEnd, setMediaReachedEnd] = useState(false);
    const [postsPage, setPostsPage] = useLatestState(0);
    const [commentsPage, setCommentsPage] = useLatestState(0);
    const [mediaPage, setMediaPage] = useLatestState(0);
    const [postsCount, setPostsCount] = useState(0);

    const [birthday, setBirthday] = useState(user?.birthday.Time.toString());

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
        if (!currentUser || currentUser.id == user.id) {
            return;
        }
        const payload = {
            senderId: currentUser.id,
            receiverId: user.id,
        };
        axiosInstance
            .post<ApiRequest, AxiosResponse<ApiResponse>>(
                "/messaging/startConversation",
                payload
            )
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
        activeTab.current = Tabs.Posts;
    };

    const handleAllTabClick = () => {
        setActiveTab(Tabs.PostsAndComments);
        activeTab.current = Tabs.PostsAndComments;
        if (!postsAndComments.current.length && !commentsReachedEnd) {
            getPosts(commentsPage.current, "comments").then((newPosts) => {
                if (newPosts.length < 50) {
                    setCommentsReachedEnd(true);
                }
                setPostsAndComments(newPosts);
            });
        }
    };

    const handleMediaTabClick = () => {
        setActiveTab(Tabs.MediaPosts);
        activeTab.current = Tabs.MediaPosts;
        if (!mediaPosts.current.length && !mediaReachedEnd) {
            getPosts(mediaPage.current, "media").then((newPosts) => {
                if (newPosts.length < 50) {
                    setMediaReachedEnd(true);
                }
                setMediaPosts(newPosts);
            });
        }
    };

    useEffect(() => {
        if (user?.birthday.Valid) {
            setBirthday(formatBirthday(user.birthday.Time.toString()));
        }
    }, [user?.birthday]);

    const getActiveTabPosts = useCallback((): Array<IPost> => {
        switch (activeTab.current) {
        case Tabs.Posts:
            return posts.current;
        case Tabs.PostsAndComments:
            return postsAndComments.current;
        case Tabs.MediaPosts:
            return mediaPosts.current;
        }
    }, [mediaPosts, posts, postsAndComments]);

    const setActiveTabPosts = useCallback(
        (posts: Array<IPost>) => {
            switch (activeTab.current) {
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
        },
        [setMediaPosts, setPosts, setPostsAndComments]
    );

    const getActiveReachedEnd = (): boolean => {
        switch (activeTab.current) {
        case Tabs.Posts:
            return postsReachedEnd;
        case Tabs.PostsAndComments:
            return commentsReachedEnd;
        case Tabs.MediaPosts:
            return mediaReachedEnd;
        }
    };

    // this is for the mediamodal
    const handleComment = useCallback(
        (comment: IPost) => {
            getActiveTabPosts().map((post) => {
                if (post.id == comment.replying_to.id.String) {
                    post.comments++;
                    return post;
                }
                return post;
            });
        },
        [getActiveTabPosts]
    );

    // this is for the mediamodal
    const handleCommentDelete = useCallback(
        (commentIdObj) => {
            // check if the id is a post id and remove the post
            const commentId = commentIdObj.postId;
            if (
                getActiveTabPosts().some((post) => {
                    return post.id == commentId;
                })
            ) {
                setPostsCount(postsCount - 1);
                setActiveTabPosts(
                    getActiveTabPosts().filter((post) => post.id != commentId)
                );
                // check if the id is a comment id and decrement the comment counter
            } else {
                // TODO: do we even need this???
                // setActiveTabPosts(getActiveTabPosts().map((post) => {
                // }));
            }
        },
        [getActiveTabPosts, postsCount, setActiveTabPosts]
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
            setPostsAndComments(
                postsAndComments.current.map((post) => {
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
            setMediaPosts(
                mediaPosts.current.map((post) => {
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
        [
            mediaPosts,
            posts,
            postsAndComments,
            setMediaPosts,
            setPosts,
            setPostsAndComments,
        ]
    );

    const handleBirthdayRemoved = useCallback(
        (userIdObj) => {
            const userId = userIdObj.id;
            if (currentUser?.id == userId && userId == user.id) {
                setUser({
                    ...user,
                    birthday: {
                        Time: new Date("0001-01-01T00:00:00Z"),
                        Valid: false,
                    },
                });
            }
        },
        [currentUser?.id, user]
    );

    // this also needs proper change
    const handleUpdatedProfile = useCallback(
        (payload) => {
            if (
                currentUser?.id == payload.userId &&
                payload.userId == user.id
            ) {
                let avatar_url: string = null;
                if (payload.profileImage) {
                    const base64Image = "data:image/png;base64,".concat(
                        payload.profileImage
                    );
                    avatar_url = base64Image;
                    getActiveTabPosts().map((post) => {
                        post.author.avatar_url = avatar_url;
                        return post;
                    });
                    currentUser.avatar_url = avatar_url;
                }
                setUser({
                    ...user,
                    display_name: payload.displayName,
                    bio: payload.bio,
                    birthday: payload.birthday ?? user.birthday,
                    avatar_url: avatar_url ?? user.avatar_url,
                });
            }
        },
        [currentUser, user, getActiveTabPosts]
    );

    const getPosts = useCallback(
        (page: number, postsType: string): Promise<IPost[]> => {
            return axios
                .get(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/posts/getPosts/${page}/${props.user.id}?type=${postsType}`,
                    { withCredentials: true }
                )
                .then((res: AxiosResponse<{ posts: IPost[] }>) => {
                    if (res.data.posts.length < 50) {
                        setPostsReachedEnd(true);
                    }
                    return res.data.posts;
                })
                .catch((err) => {
                    toast(
                        err?.response?.data?.message || "An error has occurred",
                        3000
                    );
                    return [];
                });
        },
        [props.user?.id, toast]
    );

    const getPostsCount = useCallback((): Promise<number> => {
        return axios
            .get(
                `${process.env.NEXT_PUBLIC_DOMAIN_URL}/posts/getPostsCount/${props.user.id}`,
                { withCredentials: true }
            )
            .then((res: AxiosResponse<{ count: number }>) => {
                return res.data.count;
            });
    }, [props.user?.id]);

    const loadMorePosts = (lastItemIndex: number) => {
        switch (activeTab.current) {
        case Tabs.Posts:
            // if we have less than 50 items in the array, then we dont need to load more items cuz we are already at the end
            if (lastItemIndex < 49) {
                setPostsReachedEnd(true);
                return;
            }
            setPostsPage(postsPage.current + 1);
            getPosts(postsPage.current, "posts").then((newPosts) => {
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
            setCommentsPage(commentsPage.current + 1);
            getPosts(commentsPage.current, "comments").then((newPosts) => {
                if (!newPosts.length) {
                    setCommentsReachedEnd(true);
                    return;
                }
                setPostsAndComments(
                    postsAndComments.current.concat(newPosts)
                );
            });
            break;
        case Tabs.MediaPosts:
            // if we have less than 50 items in the array, then we dont need to load more items cuz we are already at the end
            if (lastItemIndex < 49) {
                setMediaReachedEnd(true);
                return;
            }
            setMediaPage(mediaPage.current + 1);
            getPosts(mediaPage.current, "media").then((newPosts) => {
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
        if (socket) {
            socket.on("commentToClient", handleComment);
            socket.on("deletePost", handleCommentDelete);
            socket.on("like", handleLike);
            socket.on("birthdayRemoved", handleBirthdayRemoved);
            socket.on("updateProfile", handleUpdatedProfile);
        }

        return () => {
            if (socket) {
                socket.off("commentToClient", handleComment);
                socket.off("deletePost", handleCommentDelete);
                socket.off("like", handleLike);
                socket.off("birthdayRemoved", handleBirthdayRemoved);
                socket.off("updateProfile", handleUpdatedProfile);
            }
        };
    }, [
        handleComment,
        handleCommentDelete,
        handleLike,
        handleBirthdayRemoved,
        handleUpdatedProfile,
        socket,
    ]);

    useEffect(() => {
        if (props.user) {
            setStatusBarTitle(props.user.display_name);
            setNotFound(false);
            getPostsCount().then((postsCount) => {
                setPostsCount(postsCount);
            });
            getPosts(postsPage.current, "posts").then((posts) => {
                setPosts(posts);
                setPostsLoading(false);
            });
        } else {
            setNotFound(true);
        }
    }, []);

    useEffect(() => {
        if (props.user && user?.id != props.user.id) {
            setPostsCount(0);
            setActiveTab(Tabs.Posts);
            activeTab.current = Tabs.Posts;
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
            postsPage.current = 0;
            commentsPage.current = 0;
            mediaPage.current = 0;
            setNotFound(false);

            getPostsCount().then((count) => {
                setPostsCount(count);
            });
            getPosts(postsPage.current, "posts").then((posts) => {
                setPosts(posts);
                setPostsLoading(false);
            });
        }
        if (!props.user) {
            setUser(null);
            setNotFound(true);
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
        return () => {
            document.body.classList.remove("overflow-hidden");
            document.body.classList.add("overflow-unset");
        };
    }, [mediaModal, editProfilePopup]);

    useEffect(() => {
        // on browser back button press, close the media modal
        window.onpopstate = () => {
            setMediaModal(false);
        };
    });

    if (notFound) {
        setStatusBarTitle("Not Found");

        return (
            <div className={`${styles.container} text-white`}>
                <div className={styles.scrollableArea}>
                    <div className={styles.user}>
                        <div className={styles.userInfo}>
                            <div
                                className={`round ${styles.userImage} ${styles.userImageNotFound}`}
                            ></div>
                            <div>
                                <p className={`${styles.display_name} text-bold`}>
                                    User Doesn&apos;t Exist
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <NextSeo
                title={
                    props.user
                        ? `${props.user.display_name} (@${props.user.username}) - Twatter`
                        : "Profile - Twatter"
                }
                description={props.user?.bio}
                openGraph={{
                    title: props.user
                        ? `${props.user.display_name} (@${props.user.username})`
                        : "Profile - Twatter",
                    description: props.user?.bio,
                    // TODO: change this
                    url: `https://twatter.illusionman1212.me/u/${props.user?.username}`,
                    type: "profile",
                    profile: {
                        username: props.user?.username,
                    },
                    images: [
                        {
                            url: props.user?.avatar_url,
                        },
                    ],
                }}
            />
            <>
                {user && (
                    <>
                        <div className={styles.content}>
                            <div className={styles.leftSide}>
                                <Friends count={20} />
                            </div>
                            <div className={styles.center}>
                                <div className="text-white">
                                    <div
                                        ref={parentContainerRef}
                                        className={`${styles.container}`}
                                    >
                                        <div className={styles.scrollableArea}>
                                            <div className={styles.user}>
                                                <div
                                                    className={styles.userInfo}
                                                >
                                                    <div
                                                        className={`round ${styles.userImage}`}
                                                        style={{
                                                            backgroundImage: `url("${
                                                                user.avatar_url ==
                                                                "default_profile.svg"
                                                                    ? "/"
                                                                    : ""
                                                            }${
                                                                user.avatar_url
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
                                                <div
                                                    className={styles.userStats}
                                                >
                                                    {currentUser?.id !=
                                                    user.id ? (
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
                                                            />
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
                                            <div
                                                className={styles.userExtraInfo}
                                            >
                                                {user.bio && (
                                                    <div className="flex gap-1">
                                                        <Note
                                                            className={
                                                                styles.icon
                                                            }
                                                            size="32"
                                                        ></Note>
                                                        <p className="mt-1Percent">
                                                            {user.bio}
                                                        </p>
                                                    </div>
                                                )}
                                                {user.birthday.Valid && (
                                                    <div className="flex gap-1">
                                                        <Gift
                                                            className={
                                                                styles.icon
                                                            }
                                                            size="32"
                                                        ></Gift>
                                                        <p className="mt-1Percent">
                                                            {birthday}
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
                                                        <DateTime
                                                            datetime={
                                                                user.created_at
                                                            }
                                                            formattingFunction={
                                                                formatJoinDate
                                                            }
                                                            style={{
                                                                display:
                                                                    "inline",
                                                            }}
                                                        />
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
                                                />
                                            </div>
                                            <div className={styles.userPosts}>
                                                <div className={styles.tabs}>
                                                    <div
                                                        className={`pointer ${
                                                            styles.postsTab
                                                        } ${
                                                            activeTab.current ==
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
                                                            activeTab.current ==
                                                                Tabs.PostsAndComments &&
                                                            styles.activeTab
                                                        }`}
                                                        onClick={
                                                            handleAllTabClick
                                                        }
                                                    >
                                                        Posts &amp; Comments
                                                    </div>
                                                    <div
                                                        className={`pointer ${
                                                            styles.mediaTab
                                                        } ${
                                                            activeTab.current ==
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
                                                        {getActiveTabPosts()
                                                            .length == 0 &&
                                                            getActiveReachedEnd() && (
                                                            <div
                                                                className="flex justify-content-center"
                                                                style={{
                                                                    padding:
                                                                        "20px",
                                                                }}
                                                            >
                                                                <p>
                                                                    @
                                                                    {
                                                                        user.username
                                                                    }{" "}
                                                                    doesn&apos;t
                                                                    have any
                                                                    posts
                                                                    under
                                                                    this
                                                                    tab.
                                                                </p>
                                                            </div>
                                                        )}
                                                        <Virtuoso
                                                            totalCount={
                                                                getActiveTabPosts()
                                                                    .length
                                                            }
                                                            className={
                                                                styles.postsContainer
                                                            }
                                                            data={getActiveTabPosts()}
                                                            endReached={
                                                                loadMorePosts
                                                            }
                                                            useWindowScroll
                                                            // eslint-disable-next-line react/display-name
                                                            components={{
                                                                Footer: () => {
                                                                    return (
                                                                        <>
                                                                            {!getActiveReachedEnd() && (
                                                                                <div
                                                                                    className={
                                                                                        styles.loadingContainer
                                                                                    }
                                                                                >
                                                                                    <Loading
                                                                                        height="50"
                                                                                        width="50"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    );
                                                                },
                                                            }}
                                                            itemContent={(
                                                                _index,
                                                                post
                                                            ) => (
                                                                <Post
                                                                    key={
                                                                        post.id
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
                                                    </>
                                                ) : (
                                                    <Loading
                                                        height="50"
                                                        width="50"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.rightSide}>
                                <div className={styles.suggestedUsersDesktop}>
                                    <SuggestedUsers
                                        users={new Array(5).fill(user)}
                                    />
                                </div>
                            </div>
                        </div>
                        {mediaModal && (
                            <MediaModal
                                modalData={modalData}
                                handleMediaClick={handleMediaClick}
                            />
                        )}
                        {editProfilePopup && (
                            <EditProfilePopup
                                setEditProfilePopup={setEditProfilePopup}
                                userData={user}
                            />
                        )}
                    </>
                )}
            </>
        </>
    );
}

export async function getServerSideProps(
    context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{ user: IUser }>> {
    let user: IUser = null;

    try {
        const res = await axios.get<{ user: IUser }>(
            `${process.env.NEXT_PUBLIC_DOMAIN_URL}/users/getUserData?username=${context.params.username}`,
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
