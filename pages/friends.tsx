/* eslint-disable react/react-in-jsx-scope */
import Navbar from "components/navbar/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";
import StatusBar from "components/statusBar";

export default function Friends(): ReactElement {
    const { user } = useUserContext();

    if (!user) return <></>;

    return (
        <div>
            <StatusBar user={user} title="Friends"/>
            <Navbar user={user} />
            <div className="text-white">friends uwu owo</div>
        </div>
    );
}
