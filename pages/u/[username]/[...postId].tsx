/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useCallback, useEffect, useState } from "react";
import Loading from "../../../components/loading";
import Head from "next/head";
import { useRouter } from "next/router";
import NavbarLoggedIn from "../../../components/navbarLoggedIn";
import NavbarLoggedOut from "../../../components/navbarLoggedOut";
import StatusBar from "../../../components/statusBar";
import { useUser } from "../../../src/hooks/useUserHook";
import axios from "axios";
import ExpandedPost from "../../../components/post/expandedPost";
import styles from "../../../components/post/expandedPost.module.scss";
import MediaModal from "../../../components/mediaModal/mediaModal";
import { User, Post } from "../../../src/types/general";
import { socket } from "../../../src/socket";
import { useToastContext } from "src/contexts/toastContext";
import { LikePayload } from "src/types/utils";
import { NextSeo } from "next-seo";

export default function UserPost(): ReactElement {
    const router = useRouter();

    const toast = useToastContext();

    const [notFound, setNotFound] = useState(null);
    const [loading, setLoading] = useState(true);
    const [post, setPost] = useState<Post>(null);
    const [modalData, setModalData] = useState({
        post: null as Post,
        imageIndex: 0,
        currentUser: null as User,
    });
    const [mediaModal, setMediaModal] = useState(false);
    const [nowCommenting, setNowCommenting] = useState(false);

    let currentUser: User = null;
    currentUser = useUser();

    const handleMediaClick = (
        _e: React.MouseEvent<HTMLElement, MouseEvent>,
        post: Post,
        index: number
    ) => {
        setModalData({
            post: post,
            imageIndex: index,
            currentUser: currentUser,
        });
        setMediaModal(true);
    };

    const renderBars = (title: string): ReactElement => {
        return (
            <>
                {currentUser ? (
                    <div className="feed">
                        <StatusBar
                            title={title}
                            user={currentUser}
                            backButton={true}
                        ></StatusBar>
                        <div className={styles.loggedInNavbarContainer}>
                            <NavbarLoggedIn user={currentUser}></NavbarLoggedIn>
                        </div>
                    </div>
                ) : (
                    <NavbarLoggedOut></NavbarLoggedOut>
                )}
            </>
        );
    };

    const handleComment = useCallback(
        (payload: Post) => {
            const newPost = post;
            newPost.comments = newPost.comments.concat(payload);
            setPost(newPost);
            setNowCommenting(false);
            toast("Commented Successfully", 2000);
        },
        [post]
    );

    const handleCommentDelete = useCallback(
        (commentId) => {
            const newPost = post;
            newPost.comments = post.comments.filter(
                (comment) => comment._id != commentId
            );
            setPost(newPost);
        },
        [post]
    );

    const handleLike = useCallback(
        (payload: LikePayload) => {
            if (payload.postId == post._id) {
                const newPost = {
                    ...post,
                };
                if (payload.likeType == "LIKE") {
                    newPost.likeUsers = newPost.likeUsers.concat(
                        currentUser?._id
                    );
                } else if (payload.likeType == "UNLIKE") {
                    newPost.likeUsers = post.likeUsers.filter(
                        (user) => user != currentUser?._id
                    );
                }
                setPost(newPost);
            }
        },
        [post]
    );

    useEffect(() => {
        socket?.on("deletePost", handleCommentDelete);
        socket?.on("commentToClient", handleComment);
        socket?.on("likeToClient", handleLike);

        return () => {
            socket?.off("deletePost", handleCommentDelete);
            socket?.off("commentToClient", handleComment);
            socket?.off("likeToClient", handleLike);
        };
    }, [socket, handleComment, handleCommentDelete, handleLike]);

    useEffect(() => {
        const cancelToken = axios.CancelToken;
        const tokenSource = cancelToken.source();
        setPost(null);
        setMediaModal(false);

        if (router.query.postId?.[0]) {
            // if url contains other queries after the post id, remove them
            if (router.query.postId.length > 1) {
                router.replace(
                    router.asPath,
                    router.asPath.substr(
                        0,
                        router.asPath.indexOf(router.query.postId[0]) +
                            router.query.postId[0].length
                    ),
                    { shallow: true }
                );
            }
            axios
                .get(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/posts/getPost?username=${router.query.username}&postId=${router.query.postId[0]}`,
                    { withCredentials: true, cancelToken: tokenSource.token }
                )
                .then((res) => {
                    setPost(res.data.post);
                    setNotFound(false);
                    setLoading(false);
                })
                .catch((err) => {
                    if (axios.isCancel(err)) {
                        console.log("Request canceled");
                    } else {
                        setLoading(false);
                        if (err.response.status == 404) {
                            setNotFound(true);
                        }
                    }
                });
        }

        return () => {
            tokenSource.cancel();
        };
    }, [router.query.postId?.[0]]);

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
                title={post ? `${post.author.display_name}'s Post - Twatter` : "Post not found - Twatter"}
                description={post?.content}
                openGraph={{
                    title: `${post?.author.display_name}'s Post - Twatter`,
                    description: post?.content,
                    url: `https://twatter.illusionman1212.me/u/${post?.author.username}/${post?._id}`,
                    type: "article",
                    article: {
                        authors: [post?.author.display_name],
                        publishedTime: post?.createdAt,
                    },
                    images: [
                        {
                            url: post?.author.profile_image,
                        },
                        {
                            url: post?.attachments?.[0],
                        },
                        {
                            url: post?.attachments?.[1],
                        },
                        {
                            url: post?.attachments?.[2],
                        },
                        {
                            url: post?.attachments?.[3],
                        },
                    ]
                }}
            />
            {!loading ? (
                <>
                    <Head>
                        <meta
                            property={"og:image"}
                            content={post?.author.profile_image}
                            key="image"
                        />
                        <meta
                            property={"og:url"}
                            content={`https://twatter.illusionman1212.me/u/${post?.author.username}/${post?._id}`}
                            key="url"
                        />
                        <meta
                            property={"og:title"}
                            content={`${post?.author.display_name}'s post`}
                            key="title"
                        />
                        <meta
                            property={"og:description"}
                            content={post?.content}
                            key="description"
                        />
                        <meta
                            property={"og:type"}
                            content={"article"}
                            key="type"
                        />
                    </Head>
                    {!notFound && post ? (
                        <>
                            {renderBars(`${post.author.display_name}'s post`)}
                            <div
                                className={`text-white ${
                                    currentUser && "feed"
                                }`}
                            >
                                <div className={styles.expandedPostContainer}>
                                    <ExpandedPost
                                        key={post._id}
                                        currentUser={currentUser}
                                        post={post}
                                        handleComment={handleComment}
                                        handlePostDelete={handleCommentDelete}
                                        handleMediaClick={handleMediaClick}
                                        callback={() => window.history.back()}
                                        nowCommenting={nowCommenting}
                                        setNowCommenting={setNowCommenting}
                                        handleLike={handleLike}
                                    ></ExpandedPost>
                                </div>
                            </div>
                            {mediaModal && (
                                <MediaModal
                                    modalData={modalData}
                                    goBackTwice={true}
                                    handleMediaClick={handleMediaClick}
                                    handleComment={handleComment}
                                    handleCommentDelete={handleCommentDelete}
                                ></MediaModal>
                            )}
                        </>
                    ) : notFound ? (
                        <>
                            {renderBars("Not Found")}
                            <div
                                className={`text-white ${
                                    currentUser && "feed"
                                } ${styles.postNotFound}`}
                            >
                                <div className="text-bold text-large">
                                    Post Not Found
                                </div>
                            </div>
                        </>
                    ) : (
                        !post && (
                            <>
                                {renderBars("Loading")}
                                <Loading height="100" width="100"></Loading>
                            </>
                        )
                    )}
                </>
            ) : (
                <Loading height="100" width="100"></Loading>
            )}
        </>
    );
}
