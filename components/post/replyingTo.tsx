import { ReactElement } from "react";
import Link from "next/link";
import { ArrowBendUpRight } from "phosphor-react";
import ProfileImage from "components/post/profileImage";
import styles from "./replyingTo.module.scss";
import { ReplyingToProps } from "src/types/props";

export default function ReplyingTo(props: ReplyingToProps): ReactElement {
    if (props.post.parent_deleted) {
        return (
            <div className={`flex mb-1Percent text-small ${styles.replyingTo}`}>
                <div style={{ marginLeft: "1.5em" }} className={`${styles.outerContainer} flex`}>
                    <ArrowBendUpRight
                        className={styles.arrowIcon}
                        size={20}
                    />
                    <div className={`${styles.innerContainer} flex align-items-center`}>
                        <span className={`${styles.content} ${styles.deletedContent}`}>
                            Deleted Post
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (!props.post.replying_to?.id.Valid) return null;

    return (
        <Link href={`/u/${props.post.replying_to.author.username.String}/${props.post.replying_to.id.String}`}>
            <a
                className={`flex mb-1Percent text-small linkColor ${styles.replyingTo}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ marginLeft: "1.5em" }} className={`${styles.outerContainer} flex`}>
                    <ArrowBendUpRight
                        className={styles.arrowIcon}
                        size={20}
                    />
                    <div className={`${styles.innerContainer} flex align-items-center`}>
                        <span style={{ paddingLeft: "0.5em", paddingRight: "0.5em" }}>
                            <ProfileImage
                                width={props.avatar_size}
                                height={props.avatar_size}
                                src={props.post.replying_to.author.avatar_url.String}
                                alt={props.post.replying_to.author.username.String}
                            />
                        </span>
                        <span
                            className="text-bold"
                        >
                            @{props.post.replying_to.author.username.String}
                            {": "}
                        </span>
                        {props.post.replying_to.content.Valid && (
                            <span className={styles.content}>
                                {props.post.replying_to.content.String}
                            </span>
                        )}
                    </div>
                </div>
            </a>
        </Link>
    );
}
