/* eslint-disable react/react-in-jsx-scope */
import Loading from "components/loading";
import Navbar from "components/navbar";
import { ReactElement } from "react";
import { useUser } from "src/hooks/useUser";

export default function Friends(): ReactElement {
    const currentUser = useUser("/login", null);

    return (
        <>
            {currentUser ? (
                <div>
                    <Navbar
                        user={currentUser}
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