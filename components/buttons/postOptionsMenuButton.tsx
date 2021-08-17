/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useState } from "react";
import styles from "./postOptionsMenuButton.module.scss";
import PostOptionsMenu from "../postOptionsContextMenu";
import { DotsThree } from "phosphor-react";
import { PostOptionsMenuButtonProps } from "../../src/types/props";

export default function PostOptionsMenuButton(
    props: PostOptionsMenuButtonProps
): ReactElement {
    const [optionsMenu, setOptionsMenu] = useState(false);
    const [offset, setOffset] = useState(-1);

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
                onClick={() => {
                    setOptionsMenu(!optionsMenu);
                }}
            ></DotsThree>
            {optionsMenu && (
                <PostOptionsMenu
                    postId={props.postId}
                    postAuthorId={props.postAuthorId}
                    postAuthorUsername={props.postAuthorUsername}
                    currentUserId={props.currentUserId}
                    deleteCallback={props.deleteCallback}
                    topOffset={offset}
                ></PostOptionsMenu>
            )}
        </div>
    );
}
