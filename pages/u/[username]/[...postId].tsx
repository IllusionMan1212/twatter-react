/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useEffect, useState } from "react";
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

export default function UserPost(): ReactElement {
    const router = useRouter();

    const [notFound, setNotFound] = useState(null);
    const [loading, setLoading] = useState(true);
    const [post, setPost] = useState(null);
    const [modalData, setModalData] = useState({
        post: null as Post,
        imageIndex: 0,
        currentUser: null as User,
    });
    const [mediaModal, setMediaModal] = useState(false);

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
                            <NavbarLoggedIn
                                user={currentUser}
                            ></NavbarLoggedIn>
                        </div>
                    </div>
                ) : (
                    <NavbarLoggedOut></NavbarLoggedOut>
                )}
            </>
        );
    };

    useEffect(() => {
        const cancelToken = axios.CancelToken;
        const tokenSource = cancelToken.source();
        setPost(null);

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
            {!loading ? (
                <>
                    <Head>
                        <title>
                            {post
                                ? `${post.author.display_name}'s Post`
                                : "Post not found"}{" "}
                            - Twatter
                        </title>
                        {/* TODO: meta tags */}
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
                                        currentUser={currentUser}
                                        post={post}
                                        handleMediaClick={handleMediaClick}
                                        callback={() => window.history.back()}
                                    ></ExpandedPost>
                                </div>
                            </div>
                            {mediaModal && (
                                <MediaModal
                                    modalData={modalData}
                                    goBackTwice={true}
                                ></MediaModal>
                            )}
                        </>
                    ) : (notFound) ? (
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
                    ) : !post && (
                        <>
                            {renderBars("Loading")}
                            <Loading height="100" width="100"></Loading>
                        </>
                    )}
                </>
            ) : (
                <Loading height="100" width="100"></Loading>
            )}
        </>
    );
}
