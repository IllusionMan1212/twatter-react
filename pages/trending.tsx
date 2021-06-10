/* eslint-disable react/react-in-jsx-scope */
import Navbar from "components/navbar";
import { ReactElement } from "react";
import { useUser } from "src/hooks/useUser";
import Loading from "components/loading";

export default function Trending(): ReactElement {
    const currentUser = useUser("/login", null);

    return (
        <>
            {currentUser ? (
                <div>
                    <Navbar
                        user={currentUser}
                    />
                    <div className="text-white">
                        trending uwu owo
                    </div>
                </div>
            ) : (
                <Loading height="100" width="100"/>
            )}
        </>
    );
}