/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "../components/statusBar";
import NavbarLoggedIn from "../components/navbarLoggedIn";
import Loading from "../components/loading";
import { useUser } from "../src/hooks/useUserHook";
import { ReactElement } from "react";

export default function Notifications(): ReactElement {
    const user = useUser("/login", null);

    return (
        <>
            {user ? (
                <>
                    <NavbarLoggedIn user={user}></NavbarLoggedIn>
                    <div className="feed">
                        <StatusBar
                            user={user}
                            title="Notifications"
                        ></StatusBar>
                    </div>
                </>
            ) : (
                <>
                    <Loading height="100" width="100"></Loading>
                </>
            )}
        </>
    );
}
