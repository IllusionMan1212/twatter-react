/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "../components/statusBar";
import NavbarLoggedIn from "../components/navbarLoggedIn";
import Loading from "../components/loading";
import { useUser } from "../src/hooks/useUser";
import { ReactElement } from "react";

export default function Settings(): ReactElement {
    const user = useUser("/login", null);

    return (
        <>
            {user ? (
                <>
                    <NavbarLoggedIn user={user}></NavbarLoggedIn>
                    <div className="feed">
                        <StatusBar user={user} title="Settings"></StatusBar>
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
