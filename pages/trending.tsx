import Navbar from "components/navbar/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";
import StatusBar from "components/statusBar/statusBar";

export default function Trending(): ReactElement {
    const { user } = useUserContext();

    if (!user) return <></>;

    return (
        <div>
            <StatusBar title="Trending" />
            <Navbar user={user} />
            <div className="text-white">trending uwu owo</div>
        </div>
    );
}
