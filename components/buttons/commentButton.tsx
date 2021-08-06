/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import { ChatCircle } from "phosphor-react";
import styles from "./commentButton.module.scss";
import { CommentButtonProps } from "src/types/props";
import { formatBigNumbers } from "src/utils/functions";
import React from "react";

export default function CommentButton(props: CommentButtonProps): ReactElement {
    return (
        <div
            className={`flex ${styles.commentButton}`}
            onClick={(e) => {
                e.stopPropagation();
                props.handleClick();
            }}
        >
            <div className={styles.commentButtonContainer}>
                <div className={styles.commentButtonContainerChild}>
                    <ChatCircle size="30" color="#6067fe"></ChatCircle>
                </div>
            </div>
            {props.post.comments != 0 && (
                <p>{formatBigNumbers(props.post.comments)}</p>
            )}
        </div>
    );
}
