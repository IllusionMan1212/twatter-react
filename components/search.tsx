/* eslint-disable react/react-in-jsx-scope */
import { ReactElement } from "react";
import styles from "./search.module.scss";

export default function Search(): ReactElement {
    return (
        <input
            className={`text-medium text-bold ${styles.search}`}
            type="text"
            placeholder="Search"
        ></input>
    );
}
