import { NextRequest, NextResponse } from "next/server";

// you have to be signed in to access these routes.
const signedInRoutes = [
    "/home",
    "/messages",
    "/settings",
    "/notifications",
    "/trending",
    "/friends",
];

// you have to be signed out to access these routes.
// all routes that aren't mentioned in either array can be accessed whether you're signed in or out.
const signedOutRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
];

export default function middleware(req: NextRequest) {
    const session = req.cookies.session;

    if (
        !session &&
        signedInRoutes.find((route) => req.nextUrl.pathname.startsWith(route))
    ) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";

        return NextResponse.redirect(url);
    } else if (
        session &&
        signedOutRoutes.find((route) =>
            route === "/"
                ? route === req.nextUrl.pathname
                : req.nextUrl.pathname.startsWith(route)
        )
    ) {
        const url = req.nextUrl.clone();
        url.pathname = "/home";

        return NextResponse.redirect(url);
    }
}
