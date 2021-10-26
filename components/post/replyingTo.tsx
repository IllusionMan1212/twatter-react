import { ReactElement } from "react";
import Link from "next/link";
import { ArrowArcLeft } from "phosphor-react";
import ProfileImage from "components/post/profileImage";
import styles from "./replyingTo.module.scss";
import { ReplyingToProps } from "src/types/props";

export default function ReplyingTo(props: ReplyingToProps): ReactElement {
    return (
        <Link href={`/u/${props.username}/${props.post_id}`}>
            <a
                className={`flex mb-1Percent text-small linkColor ${styles.replyingTo}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`${styles.outerContainer} flex`}>
                    <ArrowArcLeft
                        style={{ minWidth: 25, minHeight: 25 }}
                        size={25}
                    />
                    <div className={`${styles.innerContainer} flex align-items-center`}>
                        <span style={{ paddingLeft: "1em", paddingRight: "0.5em" }}>Replying to:</span>
                        <ProfileImage
                            width={props.avatar_size}
                            height={props.avatar_size}
                            src={props.avatar_url}
                        />
                        <span
                            className="text-bold"
                            style={{ paddingLeft: "0.5em" }}
                        >
                            @{props.username}
                            {"'s post: "}
                        </span>
                        {props.content.Valid && (
                            <span className={styles.content}>
                                &quot;
                                {props.content.String}
                                &quot;
                            </span>
                        )}
                    </div>
                </div>
            </a>
        </Link>
    );
}
