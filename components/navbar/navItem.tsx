import { ReactElement } from "react";
import { NavItemProps } from "src/types/props";
import styles from "./navItem.module.scss";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUserContext } from "src/contexts/userContext";

export default function NavItem(props: NavItemProps): ReactElement {
    const { user } = useUserContext();
    const router = useRouter();

    const isActive = router.asPath === props.to
    const isProfileNavItemActive = router.asPath === `/u/${user.username}` && props.as === "profile"

    return (
        <>
            {props.to ? (
                <Link href={props.to}>
                    <a>
                        <div className={`${styles.navItem} ${isActive ? styles.activeNavItem : ""}`} onClick={props.onClick}>
                            {props.children}
                        </div>
                    </a>
                </Link>
            ) : (
                <div
                    className={`${styles.navItem} ${isProfileNavItemActive ? styles.activeProfileNavItem : ""}`}
                    onClick={props.onClick}
                >
                    {props.children}
                </div>
            )}
        </>
    )
}
