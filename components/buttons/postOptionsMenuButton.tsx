import { ReactElement, useState } from "react";
import styles from "./postOptionsMenuButton.module.scss";
import ContextMenu from "components/contextMenu/contextMenu";
import ContextMenuItem from "components/contextMenu/contextMenuItem";
import { DotsThree, Eraser, Flag, Share, Link } from "phosphor-react";
import { PostOptionsMenuButtonProps } from "src/types/props";
import axios from "src/axios";
import { AxiosResponse } from "axios";
import { useToastContext } from "src/contexts/toastContext";
import { useUserContext } from "src/contexts/userContext";
import { useGlobalContext } from "src/contexts/globalContext";

interface ApiRequest {
    postAuthorId: string;
    postId: string;
}

interface ApiResponse {
    message: string;
}

export default function PostOptionsMenuButton(
    props: PostOptionsMenuButtonProps
): ReactElement {
    const toast = useToastContext();
    const { socket } = useUserContext();
    const { setSharer } = useGlobalContext();

    const [optionsMenu, setOptionsMenu] = useState(false);
    const [offset, setOffset] = useState(-1);

    const handleReport = () => {
        setOptionsMenu(!optionsMenu);
        console.log("Coming soon");
    };

    const handleShare = () => {
        setOptionsMenu(!optionsMenu);
        const url = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/u/${props.postAuthorUsername}/${props.postId}`;
        const title = `${props.postAuthorUsername}'s post - Twatter`;

        if (navigator.share) {
            navigator.share({
                url: url,
                title: title,
            }).then(() => {
                console.log("shared successfully");
            }).catch(() => {
                console.log("error while sharing");
            });
        } else {
            setSharer({
                enabled: true,
                text: title,
                url: url
            });
        }
    };

    const handleCopyLink = () => {
        setOptionsMenu(!optionsMenu);
        const link = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/u/${props.postAuthorUsername}/${props.postId}`;
        const tempInput = document.createElement("input");
        tempInput.value = link;
        tempInput.style.position = "fixed";
        tempInput.style.top = "0";
        document.body.appendChild(tempInput);
        tempInput.focus();
        tempInput.select();
        tempInput.setSelectionRange(0, 99999);
        try {
            document.execCommand("copy");
            toast("Copied Successfully", 3000);
        } catch (err) {
            toast("Error while copying link", 3000);
        }
        finally {
            document.body.removeChild(tempInput);
        }
    };

    const handleDelete = () => {
        setOptionsMenu(!optionsMenu);
        if (props.postAuthorId != props.currentUserId) {
            return;
        }
        const payload = {
            postAuthorId: props.postAuthorId,
            postId: props.postId,
        };
        const socketPayload = {
            eventType: "deletePost",
            data: {
                postId: props.postId,
            }
        };
        axios
            .post<ApiRequest, AxiosResponse<ApiResponse>>("posts/deletePost", payload)
            .then((res) => {
                props.deleteCallback?.();
                socket.send(JSON.stringify(socketPayload));
                toast(res.data.message, 3000);
            })
            .catch((err) => {
                toast(err?.response?.data?.message ?? "An error has occurred while deleting your post", 3000);
            });
    };

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                setOptionsMenu(!optionsMenu);
                if (props.parentContainerRef && !optionsMenu) {
                    const parent = props.parentContainerRef.current.getBoundingClientRect();
                    setOffset(parent.height - (e.clientY - parent.top));
                }
            }}
            className={styles.optionsButton}
            data-cy="postOptionsBtn"
        >
            <DotsThree
                className="pointer"
                size="30"
                color="#8F8F8F"
            ></DotsThree>
            {optionsMenu && (
                <ContextMenu
                    topOffset={offset}
                >
                    <>
                        <ContextMenuItem
                            text="Report Post"
                            icon={Flag}
                            onClick={handleReport}
                        />
                        <hr />
                        <ContextMenuItem
                            text="Share Post"
                            icon={Share}
                            onClick={handleShare}
                        />
                        <hr />
                        <ContextMenuItem
                            text="Copy Link"
                            icon={Link}
                            onClick={handleCopyLink}
                        />
                        {props.postAuthorId == props.currentUserId ? (
                            <>
                                <hr />
                                <ContextMenuItem
                                    text="Delete Post"
                                    icon={Eraser}
                                    color="#EC4646"
                                    onClick={handleDelete}
                                />
                            </>
                        ) : null}
                    </>
                </ContextMenu>
            )}
        </div>
    );
}
