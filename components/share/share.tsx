import { ReactElement } from "react";
import { FacebookLogo, RedditLogo, TwitterLogo } from "phosphor-react";
import styles from "./share.module.scss";
import { ShareProps } from "src/types/props";
import { useGlobalContext } from "src/contexts/globalContext";

export default function Share(props: ShareProps): ReactElement {
    const { sharer, setSharer } = useGlobalContext();

    return (
        <>
            {sharer.enabled && (
                <div
                    className={styles.container}
                    onClick={() => setSharer({ enabled: false })}
                >
                    <div
                        className={styles.shareContainer}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.header}>Share On</div>
                        <div className={styles.logos}>
                            <a href={`https://facebook.com/sharer/sharer.php?u=${props.url}`} target="_blank" rel="noreferrer" >
                                <div className={styles.logo}>
                                    <FacebookLogo
                                        color="#656BEE"
                                        weight="fill"
                                        size={52}
                                    />
                                    <p>Facebook</p>
                                </div>
                            </a>
                            <a href={`https://reddit.com/submit?title=${props.text}&url=${props.url}`} target="_blank" rel="noreferrer">
                                <div className={styles.logo}>
                                    <RedditLogo
                                        color="#FF965B"
                                        weight="fill"
                                        size={52}
                                    />
                                    <p>Reddit</p>
                                </div>
                            </a>
                            <a href={`https://twitter.com/share?text=${props.text}&url=${props.url}`} target="_blank" rel="noreferrer">
                                <div className={styles.logo}>
                                    <TwitterLogo
                                        color="#31A8FF"
                                        weight="fill"
                                        size={52}
                                    />
                                    <p>Twitter</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
