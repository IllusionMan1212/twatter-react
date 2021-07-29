/* eslint-disable react/react-in-jsx-scope */
import styles from "./navbar.module.scss";
import {
    HouseLine,
    Users,
    MagnifyingGlass,
    TrendUp,
} from "phosphor-react";
import Router from "next/router";
import { NavbarLoggedInProps } from "../src/types/props";
import { ReactElement, useState } from "react";
import ProfileImage from "./post/profileImage";
import UserContextMenu from "./userContextMenu";

export default function Navbar(
    props: NavbarLoggedInProps
): ReactElement {
    const [userMenu, setUserMenu] = useState(false);

    return (
        <div className={`${styles.navbar}`}>
            <div
                className={styles.navbarItem}
                onClick={() => {
                    Router.push("/home");
                }}
            >
                <HouseLine size="30" weight="fill"/>
            </div>
            <div
                className={styles.navbarItem}
                onClick={() => {
                    // TODO: implement searchbar for mobile
                }}
            >
                <MagnifyingGlass size="30" weight="fill"/>
            </div>
            <div
                className={styles.navbarItem}
                onClick={() => {
                    Router.push("/trending");
                }}
            >
                <TrendUp size="30" weight="fill"/>
            </div>
            <div
                className={styles.navbarItem}
                onClick={() => {
                    Router.push("/friends");
                }}
            >
                <Users size="30" weight="fill"/>
            </div>
            <div
                className={styles.navbarItem}
                onClick={() => {
                    setUserMenu(!userMenu);
                }}
            >
                <ProfileImage
                    width={30}
                    height={30}
                    src={props.user.avatar_url}
                />
                <UserContextMenu
                    currentUser={props.user}
                    open={userMenu}
                ></UserContextMenu>
            </div>
        </div>
    );
}
