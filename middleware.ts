import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    // Admin paths protection
    if (pathname.startsWith("/admin")) {
        // If no token, redirect to login
        if (!token) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Check for admin/manager roles
        const allowedRoles = ["SUPERADMIN", "ADMIN", "MANAGER"];
        const userRole = token.role as string;

        if (!userRole || !allowedRoles.includes(userRole)) {
            // Redirect unauthorized users to home
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
