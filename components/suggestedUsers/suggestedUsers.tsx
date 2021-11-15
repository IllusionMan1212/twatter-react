/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import styles from "./suggestedUsers.module.scss";
import SuggestedUser from "./suggestedUser";
import { SuggestedUsersProps } from "src/types/props";

export default function SuggestedUsers(
    props: SuggestedUsersProps
): ReactElement {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <p className="text-bold">Users You Might Like</p>
            </div>
            <div className={styles.accounts}>
                {props.users.map((user, i) => (
                    <SuggestedUser key={i} user={user}></SuggestedUser>
                ))}
            </div>
        </div>
    );
}
