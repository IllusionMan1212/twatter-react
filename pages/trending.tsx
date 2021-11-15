/* eslint-disable react/react-in-jsx-scope */
import Navbar from "components/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";
import StatusBar from "components/statusBar";

export default function Trending(): ReactElement {
    const { user } = useUserContext();

    if (!user) return <></>;

    return (
        <div>
            <StatusBar user={user} title="Trending" />
            <Navbar user={user} />
            <div className="text-white">trending uwu owo</div>
        </div>
    );
}
