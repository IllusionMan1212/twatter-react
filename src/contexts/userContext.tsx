/* eslint-disable react/react-in-jsx-scope */
import { createContext, ReactElement, useContext } from "react";
import { useUser } from "src/hooks/useUser";
import { IUser } from "src/types/general";

const UserContext = createContext<IUser>({
    _id: null,
    bio: null,
    birthday: null,
    createdAt: null,
    display_name: null,
    finished_setup: null,
    profile_image: null,
    username: null,
});

// WIP
export function UserWrapper({ children }: any): ReactElement {
    const currentUser = useUser();

    return (
        <>
            <UserContext.Provider value={currentUser}>
                {children}
            </UserContext.Provider>
        </>
    );
}

export function useUserContext(): IUser {
    return useContext(UserContext);
}