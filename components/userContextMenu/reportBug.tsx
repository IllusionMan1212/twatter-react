import { Bug } from "phosphor-react";
import { Dispatch, memo, ReactElement, SetStateAction } from "react";
import styles from "./userContextMenu.module.scss";

interface ReportBugProps {
    setUserMenu: Dispatch<SetStateAction<boolean>>;
}

const ReportBug = memo(function ReportBug({
    setUserMenu,
}: ReportBugProps): ReactElement {
    return (
        <a
            href="https://github.com/illusionman1212/twatter/issues"
            target="_blank"
            rel="noreferrer"
        >
            <div className={styles.menuItem} onClick={() => setUserMenu(false)}>
                <Bug size={25} />
                <p>Report a bug</p>
            </div>
        </a>
    );
});

export default ReportBug;
