/* eslint-disable react/react-in-jsx-scope */
import { memo, ReactElement, useRef } from "react";
import Link from "next/link";
import styles from "./profileImage.module.scss";
import { ProfileImageProps } from "src/types/props";

const ProfileImage = memo(function ProfileImage(props: ProfileImageProps): ReactElement {
    const placeholderRef = useRef<HTMLDivElement>(null);

    const handleImageLoad = () => {
        placeholderRef.current.style.visibility = "hidden";
    };

    return (
        <>
            {props.hyperlink ? (
                <Link href={`/u/${props.hyperlink}`}>
                    <a className="flex" onClick={(e) => e.stopPropagation()}>
                        <div
                            className={styles.container}
                            style={{
                                minHeight: `${props.height}px`,
                                minWidth: `${props.width}px`,
                                maxHeight: `${props.height}px`,
                                maxWidth: `${props.width}px`,
                            }}
                        >
                            <img
                                className="pointer profileImage"
                                src={`${
                                    props.src == "default_profile.svg"
                                        ? "/"
                                        : ""
                                }${props.src}`}
                                width={props.width}
                                height={props.height}
                                onLoad={handleImageLoad}
                            />
                            <div
                                ref={placeholderRef}
                                className={styles.placeholder}
                                style={{
                                    width: `${props.width * 0.95}px`,
                                    height: `${props.height * 0.95}px`,
                                }}
                            />
                        </div>
                        {props.onlineIndicator && (
                            <div className={styles.onlineIndicator}/>
                        )}
                    </a>
                </Link>
            ) : (
                <div
                    className={styles.container}
                    style={{
                        minHeight: `${props.height}px`,
                        minWidth: `${props.width}px`,
                        maxHeight: `${props.height}px`,
                        maxWidth: `${props.width}px`,
                    }}
                >
                    <img
                        className="profileImage"
                        src={`${props.src == "default_profile.svg" ? "/" : ""}${
                            props.src
                        }`}
                        width={props.width}
                        height={props.height}
                        onLoad={handleImageLoad}
                    />
                    <div
                        ref={placeholderRef}
                        className={styles.placeholder}
                        style={{
                            width: `${props.width * 0.95}px`,
                            height: `${props.height * 0.95}px`,
                        }}
                    />
                    {props.onlineIndicator && (
                        <div className={styles.onlineIndicator}/>
                    )}
                </div>
            )}
        </>
    );
});

export default ProfileImage;
