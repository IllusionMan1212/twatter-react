/* eslint-disable react/react-in-jsx-scope */
import Loading from "components/loading";
import Navbar from "components/navbar";
import { ReactElement } from "react";
import { useUserContext } from "src/contexts/userContext";

export default function Friends(): ReactElement {
    const { user } = useUserContext();

    return (
        <>
            {user ? (
                <div>
                    <Navbar
                        user={user}
                    />
                    <div className="text-white">
                        friends uwu owo
                    </div>
                </div>
            ) : (
                <Loading height="100" width="100"/>
            )}
        </>
    );
}
