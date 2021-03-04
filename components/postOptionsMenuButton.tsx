/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useRef, useState } from "react";
import styles from "./postOptionsMenuButton.module.scss";
import PostOptionsMenu from "./postOptionsContextMenu";
import { DotsThree } from "phosphor-react";
import { PostOptionsMenuProps } from "../src/types/props";

export default function PostOptionsMenuButton(
    props: PostOptionsMenuProps
): ReactElement {
    const optionsButtonRef = useRef(null);

    const [optionsMenu, setOptionsMenu] = useState(false);

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                setOptionsMenu(!optionsMenu);
            }}
        >
            <DotsThree
                ref={optionsButtonRef}
                className={`pointer ${styles.optionsButton}`}
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
                    currentUserId={props.currentUserId}
                    callback={props.callback}
                ></PostOptionsMenu>
            )}
        </div>
    );
}
