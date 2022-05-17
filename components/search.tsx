import { memo, ReactElement } from "react";
import styles from "./search.module.scss";
import { MagnifyingGlass } from "phosphor-react";

const Search = memo(function Search(): ReactElement {
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
            />
        </div>
    );
});

export default Search;
