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
import ExpandedPost from "../../../components/expandedPost";
import styles from "../../../components/expandedPost.module.scss";
import MediaModal from "../../../components/mediaModal";
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

    const handleMediaClick = (_e: React.MouseEvent<HTMLElement, MouseEvent>, post: Post, index: number) => {
        setModalData({
            post: post,
            imageIndex: index,
            currentUser: currentUser,
        });
        setMediaModal(true);
    };

    useEffect(() => {
        const cancelToken = axios.CancelToken;
        const tokenSource = cancelToken.source();

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
                    `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/posts/getPost/${router.query.postId[0]}`,
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
                            {currentUser ? (
                                <div className="feed">
                                    <StatusBar
                                        title={`${post.author.display_name}'s post`}
                                        user={currentUser}
                                    ></StatusBar>
                                    <NavbarLoggedIn user={currentUser}></NavbarLoggedIn>
                                </div>
                            ) : (
                                <NavbarLoggedOut></NavbarLoggedOut>
                            )}
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
                    ) : (
                        <>
                            {currentUser ? (
                                <div className="feed">
                                    <StatusBar
                                        title="Not Found"
                                        user={currentUser}
                                    ></StatusBar>
                                    <NavbarLoggedIn user={currentUser}></NavbarLoggedIn>
                                </div>
                            ) : (
                                <NavbarLoggedOut></NavbarLoggedOut>
                            )}
                            <div
                                className={`text-white ${
                                    currentUser && "feed"
                                } ${styles.postNotFound}`}
                            >
                                <div className="text-bold text-large">Post Not Found</div>
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
