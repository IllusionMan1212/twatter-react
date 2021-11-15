/* eslint-disable react/react-in-jsx-scope */
import StatusBar from "components/statusBar";
import Navbar from "components/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function Settings(): ReactElement {
    const { user } = useUserContext();

    if (!user) return <></>;

    return (
        <div>
            <StatusBar user={user} title="Settings"></StatusBar>
            <Navbar user={user}></Navbar>
            <div className="text-white">Settings</div>
        </div>
    );
}
