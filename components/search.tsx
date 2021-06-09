/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import styles from "./search.module.scss";
import { MagnifyingGlass } from "phosphor-react";

export default function Search(): ReactElement {
    return (
        <div className={styles.container}>
            <MagnifyingGlass
                className={styles.icon}
                weight="bold"
                size={30}
            />
            <input
                className={`${styles.search}`}
                type="text"
                placeholder="Search..."
            ></input>
        </div>
    );
}
