/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "components/statusBar";
import Navbar from "components/navbar";
import Loading from "components/loading";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function Notifications(): ReactElement {
    const { user } = useUserContext();

    return (
        <>
            {user ? (
                <>
                    <Navbar user={user}></Navbar>
                    <div>
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
