/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import Link from "next/link";
import styles from "./profileImage.module.scss";
import { ProfileImageProps } from "src/types/props";

export default function ProfileImage(props: ProfileImageProps): ReactElement {
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
                            />
                            <div
                                className={styles.placeholder}
                                style={{
                                    width: `${props.width * 0.95}px`,
                                    height: `${props.height * 0.95}px`,
                                }}
                            ></div>
                        </div>
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
                        className="pointer profileImage"
                        src={`${props.src == "default_profile.svg" ? "/" : ""}${
                            props.src
                        }`}
                        width={props.width}
                        height={props.height}
                    />
                    <div
                        className={styles.placeholder}
                        style={{
                            width: `${props.width * 0.95}px`,
                            height: `${props.height * 0.95}px`,
                        }}
                    ></div>
                </div>
            )}
        </>
    );
}
