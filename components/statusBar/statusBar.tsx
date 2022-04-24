import { ReactElement, useEffect, useState } from "react";
import { useUserContext } from "src/contexts/userContext";
import StatusBarLoggedIn from "components/statusBar/statusBarLoggedIn";
import StatusBarLoggedOut from "components/statusBar/statusBarLoggedOut";
import { useRouter } from "next/router";

interface StatusBarProps {
    title: string;
}

const statusBarBackButtonRoutes = [
    "/u/[username]/[...postId]",
];

const noBarRoutes = [
    "/404",
    "/register/setting-up"
];

export default function StatusBar({ title }: StatusBarProps): ReactElement {
    const { user } = useUserContext();
    const router = useRouter();

    const [backButton, setBackButton] = useState(false);
    const [showBar, setShowBar] = useState(false);

    useEffect(() => {
        if (noBarRoutes.includes(router.route)) {
            setShowBar(false);
        } else {
            setShowBar(true);
        }

        if (statusBarBackButtonRoutes.includes(router.route)) {
            setBackButton(true);
        } else {
            setBackButton(false);
        }
    }, [router.route]);

    if (!user) return <StatusBarLoggedOut />;
    if (!showBar) return null;

    return <StatusBarLoggedIn title={title} backButton={backButton} />;
}
