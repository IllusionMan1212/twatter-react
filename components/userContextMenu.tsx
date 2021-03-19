/* eslint-disable react/react-in-jsx-scope */
import axios from "../src/axios";
import Router from "next/router";
import { ReactElement } from "react";
import { useToastContext } from "../src/contexts/toastContext";
import { UserContextMenuProps } from "../src/types/props";
import styles from "./userContextMenu.module.scss";
import { socket } from "../src/socket";

export default function UserContextMenu(
    props: UserContextMenuProps
): ReactElement {
    const toast = useToastContext();
    // const socket = useSocketContext();

    const logout = () => {
        axios
            .delete("/users/logout")
            .then(() => {
                toast("Logged out", 3000);
                socket.disconnect();
                Router.push("/login");
            })
            .catch((err) => {
                console.error(err);
            });
    };

    return (
        <>
            <div className={`${styles.menu}`}>
                <div
                    onClick={() =>
                        Router.push(`/u/${props.currentUser.username}`)
                    }
                >
                    Profile
                </div>
                <hr />
                <div onClick={() => logout()}>Logout</div>
            </div>
            <div className="outsideClickOverlay"></div>
        </>
    );
}
