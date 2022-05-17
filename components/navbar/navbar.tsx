import styles from "./navbar.module.scss";
import {
    HouseLine,
    Users,
    MagnifyingGlass,
    TrendUp,
} from "phosphor-react";
import { ReactElement, useEffect, useState } from "react";
import ProfileImage from "components/post/profileImage";
import UserContextMenu from "components/userContextMenu/userContextMenu";
import NavItem from "components/navbar/navItem";
import { useUserContext } from "src/contexts/userContext";
import { useRouter } from "next/router";

const noBarRoutes = [
    "/register/setting-up"
];

export default function Navbar(): ReactElement {
    const { user } = useUserContext();
    const router = useRouter();

    const [userMenu, setUserMenu] = useState(false);
    const [showBar, setShowBar] = useState(false);

    useEffect(() => {
        if (noBarRoutes.includes(router.route)) {
            setShowBar(false);
        } else {
            setShowBar(true);
        }
    }, [router.route]);

    if (!user || !showBar) return null;

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
                    alt={user.username}
                />
                <UserContextMenu
                    open={userMenu}
                    setUserMenu={setUserMenu}
                />
            </NavItem>
        </div>
    );
}
