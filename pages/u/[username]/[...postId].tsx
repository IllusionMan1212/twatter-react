/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useCallback, useEffect, useState } from "react";
import Loading from "../../../components/loading";
import { useRouter } from "next/router";
import StatusBarLoggedOut from "../../../components/statusBarLoggedOut";
import StatusBar from "../../../components/statusBar";
import { useUser } from "../../../src/hooks/useUser";
import axios from "axios";
import ExpandedPost from "../../../components/post/expandedPost";
import styles from "../../../components/post/expandedPost.module.scss";
import MediaModal from "../../../components/mediaModal/mediaModal";
import { IUser, IPost, IExpandedPost } from "../../../src/types/general";
import { socket } from "src/hooks/useSocket";
import { useToastContext } from "src/contexts/toastContext";
import { LikePayload } from "src/types/utils";
import { NextSeo } from "next-seo";
import { GetServerSidePropsContext } from "next";
import { UserPostProps } from "src/types/props";
import useScrollRestoration from "src/hooks/useScrollRestoration";
import { ArrowLeft } from "phosphor-react";

export default function UserPost(props: UserPostProps): ReactElement {
    const router = useRouter();
    useScrollRestoration(router);

    const toast = useToastContext();

    const [notFound, setNotFound] = useState(null);
    const [loading, setLoading] = useState(true);
    const [post, setPost] = useState<IExpandedPost>(null);
    const [modalData, setModalData] = useState({
        post: null as IPost,
        imageIndex: 0,
        currentUser: null as IUser,
    });
    const [mediaModal, setMediaModal] = useState(false);
    const [nowCommenting, setNowCommenting] = useState(false);

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
                    <StatusBarLoggedOut></StatusBarLoggedOut>
                )}
            </>
        );
    };

    const handleComment = useCallback(
        (payload: IPost) => {
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
        if (socket?.connected) {
            socket.on("deletePost", handleCommentDelete);
            socket.on("commentToClient", handleComment);
            socket.on("likeToClient", handleLike);
        }

        return () => {
            if (socket?.connected) {
                socket.off("deletePost", handleCommentDelete);
                socket.off("commentToClient", handleComment);
                socket.off("likeToClient", handleLike);
            }
        };
    }, [handleComment, handleCommentDelete, handleLike]);

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
                title={props.post ? `${props.post.author.display_name}'s Post - Twatter` : "Post not found - Twatter"}
                description={props.post?.content}
                openGraph={{
                    title: `${props.post?.author.display_name}'s Post - Twatter`,
                    description: props.post?.content,
                    url: `https://twatter.illusionman1212.me/u/${props.post?.author.username}/${props.post?._id}`,
                    type: "article",
                    article: {
                        authors: [props.post?.author.display_name],
                        publishedTime: props.post?.createdAt,
                    },
                    images: [
                        {
                            url: props.post?.author.profile_image,
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
                    ]
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
                                        <p>{post.author.display_name}&apos;s post</p>
                                    </div>
                                    <ExpandedPost
                                        key={post._id}
                                        currentUser={currentUser}
                                        post={post}
                                        handleMediaClick={handleMediaClick}
                                        callback={() => window.history.back()}
                                        nowCommenting={nowCommenting}
                                        setNowCommenting={setNowCommenting}
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

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<any> {
    let res = null;
    let post: IPost = null;

    try {
        res = await axios
            .get(
                `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/posts/getPost?username=${context.params.username}&postId=${context.params.postId[0]}`,
                { withCredentials: true }
            );
        post = res.data.post;
    } catch (err) {
        console.error(err);
    }

    return {
        props: { post: post }
    };
}
