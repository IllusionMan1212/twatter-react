/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "components/statusBar";
import Navbar from "components/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function Notifications(): ReactElement {
    const { user } = useUserContext();

    if (!user) return <></>;

    return (
        <>
            <Navbar user={user}></Navbar>
            <div>
                <StatusBar
                    user={user}
                    title="Notifications"
                ></StatusBar>
            </div>
        </>
    );
}
