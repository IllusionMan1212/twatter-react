/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useCallback, useEffect, useState } from "react";
import Loading from "components/loading";
import { useRouter } from "next/router";
import StatusBarLoggedOut from "components/statusBarLoggedOut";
import StatusBar from "components/statusBar";
import axios, { AxiosResponse } from "axios";
import ExpandedPost from "components/post/expandedPost";
import styles from "components/post/expandedPost.module.scss";
import MediaModal from "components/mediaModal/mediaModal";
import { IUser, IPost } from "src/types/general";
import { useToastContext } from "src/contexts/toastContext";
import { LikePayload } from "src/types/utils";
import { NextSeo } from "next-seo";
import { GetServerSidePropsContext } from "next";
import { UserPostProps } from "src/types/props";
import useScrollRestoration from "src/hooks/useScrollRestoration";
import { ArrowLeft } from "phosphor-react";
import { useUserContext } from "src/contexts/userContext";
import Router from "next/router";

interface ApiResponse {
    comments: IPost[];
}

export default function UserPost(props: UserPostProps): ReactElement {
    const router = useRouter();
    useScrollRestoration(router);

    const toast = useToastContext();
    const { user: currentUser, socket } = useUserContext();

    const [notFound, setNotFound] = useState(null);
    const [loading, setLoading] = useState(true);
    const [post, setPost] = useState<IPost>(null);
    const [modalData, setModalData] = useState({
        post: null as IPost,
        imageIndex: 0,
        currentUser: null as IUser,
    });
    const [mediaModal, setMediaModal] = useState(false);
    const [nowCommenting, setNowCommenting] = useState(false);
    const [comments, setComments] = useState<Array<IPost>>([]);
    const [loadingComments, setLoadingComments] = useState(true);

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

    const renderBars = (title: string): ReactElement => {
        return (
            <>
                {currentUser ? (
                    <StatusBar
                        title={title}
                        user={currentUser}
                        backButton={true}
                    ></StatusBar>
                ) : (
                    <StatusBarLoggedOut />
                )}
            </>
        );
    };

    const handleComment = useCallback(
        (comment: IPost) => {
            setPost((post) => {
                post.comments++;
                return post;
            });
            setComments((comments) => {
                comments.unshift(comment);
                return comments;
            });
            setNowCommenting(false);
            toast("Commented Successfully", 2000);
        },
        [toast]
    );

    const handleCommentDelete = useCallback(
        (commentIdObj) => {
            const commentId = commentIdObj.postId;
            setPost((post) => {
                post.comments--;
                return post;
            });
            setComments(comments => {
                return comments.filter(
                    (comment) => comment.id != commentId
                );
            });
        },
        []
    );

    const handleLike = useCallback(
        (payload: LikePayload) => {
            if (payload.postId == post.id) {
                if (payload.likeType == "LIKE") {
                    setPost({
                        ...post,
                        likes: post.likes + 1,
                        liked: true
                    });
                } else if (payload.likeType == "UNLIKE") {
                    setPost({
                        ...post,
                        likes: post.likes - 1,
                        liked: false
                    });
                }
            } else {
                setComments((comments) => {
                    return comments.map((comment) => {
                        if (comment.id == payload.postId) {
                            if (payload.likeType == "LIKE") {
                                comment.liked = true;
                                comment.likes++;
                            } else if (payload.likeType == "UNLIKE") {
                                comment.liked = false;
                                comment.likes--;
                            }
                            return comment;
                        }
                        return comment;
                    });
                });        
            }
        },
        [post]
    );

    useEffect(() => {
        setComments([]);
        setLoadingComments(true);
        if (props.post) {
            axios
                .get(
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/posts/getComments/${props.post.id}`,
                    { withCredentials: true }
                )
                .then((res: AxiosResponse<ApiResponse>) => {
                    setComments(res.data.comments);
                    setLoadingComments(false);
                })
                .catch((err) => {
                    toast(
                        err?.response?.data?.message || "An error has occurred",
                        3000
                    );
                });
        }
    }, [post?.id, toast]);

    useEffect(() => {
        if (socket) {
            socket.on("like", handleLike);
            socket.on("deletePost", handleCommentDelete);
            socket.on("commentToClient", handleComment);
        }

        return () => {
            if (socket) {
                socket.off("deletePost", handleCommentDelete);
                socket.off("commentToClient", handleComment);
                socket.off("like", handleLike);
            }
        };
    }, [handleComment, handleCommentDelete, handleLike, socket]);

    useEffect(() => {
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
                    { shallow: true, scroll: false }
                );
            }
            if (props.post) {
                setNotFound(false);
                setLoading(false);
                setPost(props.post);
            } else {
                setNotFound(true);
                setLoading(false);
            }
        }
    }, [router.query.postId?.[0]]);

    // TODO: make mediaModal state global and move this into _app.tsx
    useEffect(() => {
        if (mediaModal) {
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
    }, [mediaModal]);

    // TODO: move this into _app.tsx, and refactor it for multiple open modals
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
                    props.post
                        ? `${props.post.author.display_name}'s Post - Twatter`
                        : "Post not found - Twatter"
                }
                description={props.post?.content}
                openGraph={{
                    title: `${props.post?.author.display_name}'s Post - Twatter`,
                    description: props.post?.content,
                    url: `https://twatter.illusionman1212.me/u/${props.post?.author.username}/${props.post?.id}`,
                    type: "article",
                    article: {
                        authors: [props.post?.author.display_name],
                        publishedTime: props.post?.created_at,
                    },
                    images: [
                        {
                            url: props.post?.author.avatar_url,
                        },
                        {
                            url: props.post?.attachments?.[0]?.url,
                        },
                        {
                            url: props.post?.attachments?.[1]?.url,
                        },
                        {
                            url: props.post?.attachments?.[2]?.url,
                        },
                        {
                            url: props.post?.attachments?.[3]?.url,
                        },
                    ],
                }}
            />
            {!loading ? (
                <>
                    {!notFound && post ? (
                        <>
                            {renderBars(`${post.author.display_name}'s post`)}
                            <div className={styles.content}>
                                <div className={styles.leftSide}>friends</div>
                                <div className={styles.center}>
                                    <div className={styles.header}>
                                        <div
                                            className={styles.backButton}
                                            onClick={() => history.back()}
                                        >
                                            <ArrowLeft size="30"></ArrowLeft>
                                        </div>
                                        <p>
                                            {post.author.display_name}&apos;s
                                            post
                                        </p>
                                    </div>
                                    <ExpandedPost
                                        key={post.id}
                                        currentUser={currentUser}
                                        post={post}
                                        handleMediaClick={handleMediaClick}
                                        callback={() => Router.back()}
                                        nowCommenting={nowCommenting}
                                        setNowCommenting={setNowCommenting}
                                        comments={comments}
                                        loadingComments={loadingComments}
                                    ></ExpandedPost>
                                </div>
                                <div className={styles.rightSide}>trending</div>
                            </div>
                            {mediaModal && (
                                <MediaModal
                                    modalData={modalData}
                                    goBackTwice={true}
                                    handleMediaClick={handleMediaClick}
                                ></MediaModal>
                            )}
                        </>
                    ) : notFound ? (
                        <>
                            {renderBars("Not Found")}
                            <div
                                className={`text-white ${styles.postNotFound}`}
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

interface ServerSideResponse {
    post: IPost;
}

export async function getServerSideProps(
    context: GetServerSidePropsContext
): Promise<{ props: { post: IPost } }> {
    let res = null;
    let post: IPost = null;

    try {
        res = await axios.get<ServerSideResponse>(
            `${process.env.NEXT_PUBLIC_DOMAIN_URL}/posts/getPost?username=${context.params.username}&postId=${context.params.postId[0]}`,
            {
                withCredentials: true,
                // cookies aren't being sent automatically here for some reason
                headers: {
                    Cookie: `session=${context.req.cookies.session}`
                }
            }
        );
        post = res.data.post;
    } catch (err) {
        console.error(err);
    }

    return {
        props: { post: post },
    };
}
