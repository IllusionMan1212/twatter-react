/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "../components/statusBar";
import Navbar from "../components/navbar";
import Loading from "../components/loading";
import { useUser } from "../src/hooks/useUser";
import { ReactElement } from "react";

export default function Settings(): ReactElement {
    const user = useUser("/login", null);

    return (
        <>
            {user ? (
                <>
                    <Navbar user={user}></Navbar>
                    <div>
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
