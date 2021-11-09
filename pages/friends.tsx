/* eslint-disable react/react-in-jsx-scope */
import Navbar from "components/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function Friends(): ReactElement {
    const { user } = useUserContext();

    if (!user) return <></>;

    return (
        <div>
            <Navbar
                user={user}
            />
            <div className="text-white">
                friends uwu owo
            </div>
        </div>
    );
}
