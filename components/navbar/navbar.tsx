/* eslint-disable react/react-in-jsx-scope */
import styles from "./navbar.module.scss";
import {
    HouseLine,
    Users,
    MagnifyingGlass,
    TrendUp,
} from "phosphor-react";
import { ReactElement, useState } from "react";
import ProfileImage from "components/post/profileImage";
import UserContextMenu from "components/userContextMenu";
import NavItem from "components/navbar/navItem";
import { useUserContext } from "src/contexts/userContext";

export default function Navbar(): ReactElement {
    const { user } = useUserContext();

    const [userMenu, setUserMenu] = useState(false);

    return (
        <div className={`${styles.navbar}`}>
            <NavItem to="/home">
                <HouseLine size="30" weight="fill"/>
            </NavItem>
            <NavItem to="/search">
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
                    src={user.avatar_url}
                />
                <UserContextMenu
                    open={userMenu}
                />
            </NavItem>
        </div>
    );
}
