/* eslint-disable react/react-in-jsx-scope */
import styles from "./navbar.module.scss";
import {
    HouseLine,
    Users,
    MagnifyingGlass,
    TrendUp,
} from "phosphor-react";
import { NavbarLoggedInProps } from "src/types/props";
import { ReactElement, useState } from "react";
import ProfileImage from "components/post/profileImage";
import UserContextMenu from "components/userContextMenu";
import NavItem from "components/navbar/navItem";

export default function Navbar(
    props: NavbarLoggedInProps
): ReactElement {
    const [userMenu, setUserMenu] = useState(false);

    return (
        <div className={`${styles.navbar}`}>
            <NavItem to="/home">
                <HouseLine size="30" weight="fill"/>
            </NavItem>
            <NavItem
                as="search"
                onClick={() => {
                    // TODO: implement searchbar for mobile
                }}
            >
                <MagnifyingGlass size="30" weight="fill"/>
            </NavItem>
            <NavItem to="/trending">
                <TrendUp size="30" weight="fill"/>
            </NavItem>
            <NavItem to="/friends">
                <Users size="30" weight="fill"/>
            </NavItem>
            <NavItem
                as="profile"
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
                />
            </NavItem>
        </div>
    );
}
