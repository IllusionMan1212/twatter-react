import { ReactElement, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
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
import Friends from "components/friends/friends";
import Trending from "components/trending/trending";
import { useGlobalContext } from "src/contexts/globalContext";

interface ApiResponse {
    comments: IPost[];
}

export default function UserPost(props: UserPostProps): ReactElement {
    const router = useRouter();
    useScrollRestoration(router);

    const toast = useToastContext();
    const { setStatusBarTitle } = useGlobalContext();
    const { user: currentUser, socket } = useUserContext();

    const [notFound, setNotFound] = useState(null);
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
            if (!mediaModal) {
                toast("Commented Successfully", 2000);
            }
        },
        [toast, mediaModal]
    );

    const handleCommentDelete = useCallback((commentIdObj) => {
        const commentId = commentIdObj.postId;
        setPost((post) => {
            post.comments--;
            return post;
        });
        setComments((comments) => {
            return comments.filter((comment) => comment.id != commentId);
        });
    }, []);

    const handleLike = useCallback(
        (payload: LikePayload) => {
            if (payload.postId == post.id) {
                if (payload.likeType == "LIKE") {
                    setPost({
                        ...post,
                        likes: post.likes + 1,
                        liked: true,
                    });
                    setModalData({
                        ...modalData,
                        post: {
                            ...post,
                            likes: post.likes + 1,
                            liked: true,
                        }
                    });
                } else if (payload.likeType == "UNLIKE") {
                    setPost({
                        ...post,
                        likes: post.likes - 1,
                        liked: false,
                    });
                    setModalData({
                        ...modalData,
                        post: {
                            ...post,
                            likes: post.likes - 1,
                            liked: false,
                        }
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
        [post, modalData]
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
    }, [props.post]);

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
                    router.asPath.substring(
                        0,
                        router.asPath.indexOf(router.query.postId[0]) +
                            router.query.postId[0].length
                    ),
                    null,
                    { shallow: true, scroll: false }
                );
            }
            if (props.post) {
                setNotFound(false);
                setPost(props.post);
                setStatusBarTitle(`${props.post.author.display_name}'s post`);
            } else {
                setNotFound(true);
                setStatusBarTitle("Not Found");
            }
        }
    }, [props.post, router]);

    // TODO: make mediaModal state global and move this into the globalContext
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

    // TODO: move this into the globalContext, and refactor it for multiple open modals
    useEffect(() => {
        // on browser back button press, close the media modal
        window.onpopstate = () => {
            setMediaModal(false);
        };
    });

    if (notFound) {
        return (
            <div className={`text-white ${styles.postNotFound}`}>
                <div className="text-bold text-large">Post Not Found</div>
            </div>
        );
    }

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
                    // TODO: change this
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
            <>
                {post && (
                    <>
                        <div className={styles.content}>
                            <div className={styles.leftSide}>
                                <Friends count={20} />
                            </div>
                            <div className={styles.center}>
                                <div className={styles.header}>
                                    <div
                                        className={styles.backButton}
                                        onClick={() => history.back()}
                                    >
                                        <ArrowLeft size="30" />
                                    </div>
                                    <p>
                                        {post.author.display_name}&apos;s post
                                    </p>
                                </div>
                                <ExpandedPost
                                    key={post.id}
                                    post={post}
                                    handleMediaClick={handleMediaClick}
                                    callback={() => Router.back()}
                                    nowCommenting={nowCommenting}
                                    setNowCommenting={setNowCommenting}
                                    comments={comments}
                                    loadingComments={loadingComments}
                                ></ExpandedPost>
                            </div>
                            <div className={styles.rightSide}>
                                <Trending />
                            </div>
                        </div>
                        {mediaModal && (
                            <MediaModal
                                modalData={modalData}
                                goBackTwice={true}
                                handleMediaClick={handleMediaClick}
                            ></MediaModal>
                        )}
                    </>
                )}
            </>
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
                    Cookie: `session=${context.req.cookies.session}`,
                },
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
