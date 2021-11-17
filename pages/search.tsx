import Navbar from "components/navbar/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";
import StatusBar from "components/statusBar";
import Search from "components/search";

export default function SearchPage(): ReactElement {
    const { user } = useUserContext();

    if (!user) return null;

    return (
        <div>
            <StatusBar user={user} title="Search"/>
            <Navbar user={user} />
            <Search/>
        </div>
    );
}
