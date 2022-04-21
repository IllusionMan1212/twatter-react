import StatusBar from "components/statusBar/statusBar";
import Navbar from "components/navbar/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function Notifications(): ReactElement {
    const { user } = useUserContext();

    if (!user) return <></>;

    return (
        <div>
            <StatusBar title="Notifications"/>
            <Navbar user={user}></Navbar>
            <div className="text-white">Notifications</div>
        </div>
    );
}
