import { Gif } from "phosphor-react";
import { ReactElement, MouseEvent, useEffect, useRef } from "react";
import { ImageContainerProps } from "src/types/props";
import styles from "./attachmentsContainer.module.scss";

export default function AttachmentsContainer(props: ImageContainerProps): ReactElement {
    const imagesRef = useRef<HTMLDivElement[]>([]);

    const handleClick = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, imgIndex: number) => {
        e.stopPropagation();
        if (props.post.author) {
            window.history.pushState(null, null, `/u/${props.post.author.username}/${props.post.id}/media`);
            props.handleMediaClick(e, props.post, imgIndex);
        }
    };

    useEffect(() => {
        imagesRef.current.forEach((imageRef, index) => {
            const bgImg = new Image();
            bgImg.src = props.post.attachments[index].url;
            bgImg.onload = () => {
                imageRef.style.backgroundColor = "#0000";
                imageRef.style.backgroundImage = `url(${props.post.attachments[index].url})`;
            };
        });
    }, []);

    return (
        <>
            {props.post.attachments?.length ? (
                <div className={`my-1 ${styles.imagesContainer}`}>
                    {props.post.attachments.length == 2 ? (
                        <>
                            <div className={styles.halfImageGrid}>
                                <div
                                    ref={(ref) => imagesRef.current[0] = ref}
                                    className={`max-w-100 ${styles.imageAttachment} ${styles.halfImageGrid2Images}`}
                                    style={{
                                        backgroundColor: props.post.attachments[0].bg_color,
                                    }}
                                    onClick={(e) => handleClick(e, 0)}
                                >
                                    {props.post.attachments[0].type == "gif" && (
                                        <div className={styles.gif}>
                                            <Gif size={20}/>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.halfImageGrid}>
                                <div
                                    ref={(ref) => imagesRef.current[1] = ref}
                                    className={`max-w-100 ${styles.imageAttachment} ${styles.halfImageGrid2Images}`}
                                    style={{
                                        backgroundColor: props.post.attachments[1].bg_color,
                                    }}
                                    onClick={(e) => handleClick(e, 1)}
                                >
                                    {props.post.attachments[1].type == "gif" && (
                                        <div className={styles.gif}>
                                            <Gif size={20}/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : props.post.attachments.length == 3 ? (
                        <>
                            <div className={styles.halfImageGrid}>
                                <div
                                    ref={(ref) => imagesRef.current[0] = ref}
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundColor: props.post.attachments[0].bg_color,
                                    }}
                                    onClick={(e) => handleClick(e, 0)}
                                >
                                    {props.post.attachments[0].type == "gif" && (
                                        <div className={styles.gif}>
                                            <Gif size={20}/>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.halfImageGrid}>
                                <div
                                    ref={(ref) => imagesRef.current[1] = ref}
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundColor: props.post.attachments[1].bg_color,
                                    }}
                                    onClick={(e) => handleClick(e, 1)}
                                >
                                    {props.post.attachments[1].type == "gif" && (
                                        <div className={styles.gif}>
                                            <Gif size={20}/>
                                        </div>
                                    )}
                                </div>
                                <div
                                    ref={(ref) => imagesRef.current[2] = ref}
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundColor: props.post.attachments[2].bg_color,
                                    }}
                                    onClick={(e) => handleClick(e, 2)}
                                >
                                    {props.post.attachments[2].type == "gif" && (
                                        <div className={styles.gif}>
                                            <Gif size={20}/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : props.post.attachments.length == 4 ? (
                        <>
                            <div className={styles.halfImageGrid}>
                                <div
                                    ref={(ref) => imagesRef.current[0] = ref}
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundColor: props.post.attachments[0].bg_color,
                                    }}
                                    onClick={(e) => handleClick(e, 0)}
                                >
                                    {props.post.attachments[0].type == "gif" && (
                                        <div className={styles.gif}>
                                            <Gif size={20}/>
                                        </div>
                                    )}
                                </div>
                                <div
                                    ref={(ref) => imagesRef.current[2] = ref}
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundColor: props.post.attachments[2].bg_color,
                                    }}
                                    onClick={(e) => handleClick(e, 2)}
                                >
                                    {props.post.attachments[2].type == "gif" && (
                                        <div className={styles.gif}>
                                            <Gif size={20}/>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.halfImageGrid}>
                                <div
                                    ref={(ref) => imagesRef.current[1] = ref}
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundColor: props.post.attachments[1].bg_color,
                                    }}
                                    onClick={(e) => handleClick(e, 1)}
                                >
                                    {props.post.attachments[1].type == "gif" && (
                                        <div className={styles.gif}>
                                            <Gif size={20}/>
                                        </div>
                                    )}
                                </div>
                                <div
                                    ref={(ref) => imagesRef.current[3] = ref}
                                    className={`max-w-100 ${styles.imageAttachment}`}
                                    style={{
                                        backgroundColor: props.post.attachments[3].bg_color,
                                    }}
                                    onClick={(e) => handleClick(e, 3)}
                                >
                                    {props.post.attachments[3].type == "gif" && (
                                        <div className={styles.gif}>
                                            <Gif size={20}/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.halfImageGrid}>
                            <div
                                ref={(ref) => imagesRef.current[0] = ref}
                                className={`max-w-100 ${styles.imageAttachment}`}
                                style={{
                                    backgroundColor: props.post.attachments[0].bg_color,
                                }}
                                onClick={(e) => handleClick(e, 0)}
                            >
                                {props.post.attachments[0].type == "gif" && (
                                    <div className={styles.gif}>
                                        <Gif size={20}/>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </>
    );
}
