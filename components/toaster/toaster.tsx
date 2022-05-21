import Toast from "components/toaster/toast";
import { ReactElement } from "react";
import { ToasterProps } from "src/types/props";
import styles from "./toaster.module.scss";

export default function Toaster({toasts}: ToasterProps): ReactElement {
    return (
        <div className={styles.toaster}>
            {toasts.map((toast) => {
                return <Toast key={toast.id} text={toast.text} />;
            })}
        </div>
    );
}
