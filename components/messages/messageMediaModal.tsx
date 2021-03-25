/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useEffect } from "react";
import styles from "./messageMediaModal.module.scss";
import { X } from "phosphor-react";
import { MessageMediaModalProps } from "../../src/types/props";

export default function MessageMediaModal(
    props: MessageMediaModalProps
): ReactElement {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
        e.key == "Escape" && window.history.back();
    };

    useEffect(() => {
        window.onpopstate = () => {
            props.setImageModal(false);
        };
    });

    useEffect(() => {
        window?.addEventListener("keydown", handleWindowKeyDown);

        return () => {
            window?.removeEventListener("keydown", handleWindowKeyDown);
        };
    });

    return (
        <div className={styles.imageContainer}>
            <div
                className={`${styles.icon} ${styles.closeModal}`}
                onClick={() => {
                    window.history.back();
                    props.setImageModal(false);
                }}
            >
                <X color="white" weight="bold" size="20"></X>
            </div>
            <img
                className={styles.image}
                src={props.attachment}
                onClick={(e) => e.stopPropagation()}
                height="100%"
                width="100%"
                alt="Message's attached image expanded"
            />
        </div>
    );
}
