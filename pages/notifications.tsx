import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function Notifications(): ReactElement {
    const { user } = useUserContext();

    if (!user) return null;

    return (
        <div>
            <div className="text-white">Notifications</div>
        </div>
    );
}
