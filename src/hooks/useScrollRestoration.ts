// Credits: https://gist.github.com/EQuimper/42e86abac2ee23143a1f6094ef960b87

import React from "react";

import Router, { NextRouter } from "next/router";

// Save the scroll position for the given url
function saveScrollPosition(
    url: string,
    element: HTMLElement,
    savePosition: (url: string, pos: number) => void
) {
    savePosition(url, element.scrollTop);
}

// Restore the scroll position for the given url is possible
function restoreScrollPosition(
    url: string,
    element: HTMLElement,
    positions: React.RefObject<{ [key: string]: number }>
) {
    const position = positions.current[url];

    if (position) {
        element.scrollTo({ top: position });
    }
}

export default function useScrollRestoration(router: NextRouter): void {
    const positions = React.useRef<{ [key: string]: number }>({});

    const updatePosition = (url: string, pos: number) => {
        positions.current = {
            ...positions.current,
            [url]: pos,
        };
    };

    React.useEffect(() => {
        if ("scrollRestoration" in window.history) {
            let shouldScrollRestore = false;
            window.history.scrollRestoration = "manual";

            const element = document.getElementsByTagName("html")[0];

            const onBeforeUnload = (event: BeforeUnloadEvent) => {
                saveScrollPosition(router.asPath, element, updatePosition);
                delete event["returnValue"];
            };

            const onRouteChangeStart = () => {
                saveScrollPosition(router.asPath, element, updatePosition);
            };

            const onRouteChangeComplete = (url: string) => {
                if (shouldScrollRestore) {
                    shouldScrollRestore = false;
                    restoreScrollPosition(url, element, positions);
                }
            };

            window.addEventListener("beforeunload", onBeforeUnload);
            Router.events.on("routeChangeStart", onRouteChangeStart);
            Router.events.on("routeChangeComplete", onRouteChangeComplete);
            Router.beforePopState(() => {
                shouldScrollRestore = true;
                return true;
            });

            return () => {
                window.removeEventListener("beforeunload", onBeforeUnload);
                Router.events.off("routeChangeStart", onRouteChangeStart);
                Router.events.off("routeChangeComplete", onRouteChangeComplete);
                Router.beforePopState(() => true);
            };
        }
    }, [router.asPath]);
}
