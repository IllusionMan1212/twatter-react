import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function Trending(): ReactElement {
    const { user } = useUserContext();

    if (!user) return null;

    return (
        <div>
            <div className="text-white">trending uwu owo</div>
        </div>
    );
}
