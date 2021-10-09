/* eslint-disable react/react-in-jsx-scope */
import Navbar from "components/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function Trending(): ReactElement {
    const { user } = useUserContext();

    return (
        <>
            <div>
                <Navbar user={user} />
                <div className="text-white">trending uwu owo</div>
            </div>
            )
        </>
    );
}
