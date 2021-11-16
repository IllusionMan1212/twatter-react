/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "components/statusBar";
import Navbar from "components/navbar/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function Notifications(): ReactElement {
    const { user } = useUserContext();

    if (!user) return <></>;

    return (
        <div>
            <StatusBar user={user} title="Notifications"></StatusBar>
            <Navbar user={user}></Navbar>
            <div className="text-white">Notifications</div>
        </div>
    );
}
