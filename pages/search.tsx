import Navbar from "components/navbar/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";
import StatusBar from "components/statusBar/statusBar";
import Search from "components/search";

export default function SearchPage(): ReactElement {
    const { user } = useUserContext();

    if (!user) return null;

    return (
        <div>
            <StatusBar title="Search"/>
            <Navbar/>
            <Search/>
        </div>
    );
}
