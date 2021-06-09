/* eslint-disable react/react-in-jsx-scope */
import Navbar from "components/navbar";
import { ReactElement } from "react";
import { useUser } from "src/hooks/useUser";

export default function Trending(): ReactElement {
    const currentUser = useUser();

    return (
        <div>
            <Navbar
                user={currentUser}
            />
            <div className="text-white">
                trending uwu owo
            </div>
        </div>
    );
}