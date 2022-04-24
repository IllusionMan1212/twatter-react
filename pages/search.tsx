import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";
import Search from "components/search";

export default function SearchPage(): ReactElement {
    const { user } = useUserContext();

    if (!user) return null;

    return (
        <div>
            <Search/>
        </div>
    );
}
