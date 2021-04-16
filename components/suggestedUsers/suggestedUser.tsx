/* eslint-disable react/react-in-jsx-scope */
import FollowButton from "components/buttons/followButton";
import { ReactElement } from "react";
import { SuggestedUserProps } from "src/types/props";
import styles from "./suggestedUser.module.scss";

export default function SuggestedUser(props: SuggestedUserProps): ReactElement {
    return (
        <div className={`ellipsis ${styles.container}`}>
            <div className={`ellipsis ${styles.user}`}>
                <div className={styles.userImage}>
                    <img
                        className="round"
                        style={{ height: "100%", width: "100%", objectFit: "cover" }}
                        src={`${
                            props.user.profile_image == "default_profile.svg"
                                ? "/"
                                : ""
                        }${props.user.profile_image}`}
                    />
                </div>
                <div className="ellipsis">
                    <p className="text-bold ellipsis">
                        {props.user.display_name}
                    </p>
                    <p className="usernameGrey ellipsis">
                        @{props.user.username}
                    </p>
                </div>
            </div>
            <div className={styles.followButtonContainer}>
                <FollowButton size={8}></FollowButton>
            </div>
        </div>
    );
}
