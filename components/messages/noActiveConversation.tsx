import { ReactElement } from "react";
import styles from "./noActiveConversation.module.scss";

export default function NoActiveConversation(): ReactElement {
    return (
        <div className={styles.container}>
            <h1 className="mb-2Percent">You have no active conversation right now.</h1>
            <h4 className="usernameGrey">Open one of your existing conversations or start a new one!</h4>
        </div>
    );
}
