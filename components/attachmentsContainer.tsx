/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import { ImageContainerProps } from "src/types/props";
import styles from "./attachmentsContainer.module.scss";

export default function AttachmentsContainer(props: ImageContainerProps): ReactElement {
    return (
        <>
            {props.post.attachments?.length ? (
                <div className={`my-1 ${styles.imagesContainer}`}>
                    {props.post.attachments.length == 2 ? (
                        <>
                            <div className={styles.halfImageGrid}>
                                <div
                                    className={`max-w-100 ${styles.imageAttachment} ${styles.halfImageGrid2Images}`}
                                    style={{
                                        backgroundImage: `url('${props.post.attachments[0]}')`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (props.post.author) {
                                            window.history.pushState(
                                                null,
                                                null,
                                                `/u/${props.post.author.username}/${props.post._id}/media`
                                            );
                                            props.handleMediaClick(
                                                e,
                                                props.post,
                                                0
                                            );
                                        }
                                    }}
                                ></div>
                            </div>
                            <div className={styles.halfImageGrid}>
                                <div
                                    className={`max-w-100 ${styles.imageAttachment} ${styles.halfImageGrid2Images}`}
                                    style={{
                                        backgroundImage: `url('${props.post.attachments[1]}')`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (props.post.author) {
                                            window.history.pushState(
                                                null,
                                                null,
                                                `/u/${props.post.author.username}/${props.post._id}/media`
                                            );
                                            props.handleMediaClick(
                                                e,
                                                props.post,
                                                1
                                            );
                                        }
                                    }}
                                ></div>
                            </div>
                        </>
                    ) : props.post.attachments.length == 3 ? (
                        <>
                            <div className={styles.halfImageGrid}>
                                <div
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundImage: `url('${props.post.attachments[0]}')`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (props.post.author) {
                                            window.history.pushState(
                                                null,
                                                null,
                                                `/u/${props.post.author.username}/${props.post._id}/media`
                                            );
                                            props.handleMediaClick(
                                                e,
                                                props.post,
                                                0
                                            );
                                        }
                                    }}
                                ></div>
                            </div>
                            <div className={styles.halfImageGrid}>
                                <div
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundImage: `url('${props.post.attachments[1]}')`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (props.post.author) {
                                            window.history.pushState(
                                                null,
                                                null,
                                                `/u/${props.post.author.username}/${props.post._id}/media`
                                            );
                                            props.handleMediaClick(
                                                e,
                                                props.post,
                                                1
                                            );
                                        }
                                    }}
                                ></div>
                                <div
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundImage: `url('${props.post.attachments[2]}')`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (props.post.author) {
                                            window.history.pushState(
                                                null,
                                                null,
                                                `/u/${props.post.author.username}/${props.post._id}/media`
                                            );
                                            props.handleMediaClick(
                                                e,
                                                props.post,
                                                2
                                            );
                                        }
                                    }}
                                ></div>
                            </div>
                        </>
                    ) : props.post.attachments.length == 4 ? (
                        <>
                            <div className={styles.halfImageGrid}>
                                <div
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundImage: `url('${props.post.attachments[0]}')`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (props.post.author) {
                                            window.history.pushState(
                                                null,
                                                null,
                                                `/u/${props.post.author.username}/${props.post._id}/media`
                                            );
                                            props.handleMediaClick(
                                                e,
                                                props.post,
                                                0
                                            );
                                        }
                                    }}
                                ></div>
                                <div
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundImage: `url('${props.post.attachments[2]}')`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (props.post.author) {
                                            window.history.pushState(
                                                null,
                                                null,
                                                `/u/${props.post.author.username}/${props.post._id}/media`
                                            );
                                            props.handleMediaClick(
                                                e,
                                                props.post,
                                                2
                                            );
                                        }
                                    }}
                                ></div>
                            </div>
                            <div className={styles.halfImageGrid}>
                                <div
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundImage: `url('${props.post.attachments[1]}')`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (props.post.author) {
                                            window.history.pushState(
                                                null,
                                                null,
                                                `/u/${props.post.author.username}/${props.post._id}/media`
                                            );
                                            props.handleMediaClick(
                                                e,
                                                props.post,
                                                1
                                            );
                                        }
                                    }}
                                ></div>
                                <div
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundImage: `url('${props.post.attachments[3]}')`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (props.post.author) {
                                            window.history.pushState(
                                                null,
                                                null,
                                                `/u/${props.post.author.username}/${props.post._id}/media`
                                            );
                                            props.handleMediaClick(
                                                e,
                                                props.post,
                                                3
                                            );
                                        }
                                    }}
                                ></div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.halfImageGrid}>
                            <div
                                className={`max-w-100 ${styles.imageAttachment}`}
                                style={{
                                    backgroundImage: `url('${props.post.attachments[0]}')`,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (props.post.author) {
                                        window.history.pushState(
                                            null,
                                            null,
                                            `/u/${props.post.author.username}/${props.post._id}/media`
                                        );
                                        props.handleMediaClick(
                                            e,
                                            props.post,
                                            0
                                        );
                                    }
                                }}
                            ></div>
                        </div>
                    )}
                </div>
            ) : null}
        </>
    );
}