import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth") || pathname === "/") {
    // Logged-in user visiting sign in → send to their dashboard
    if (token && pathname.startsWith("/auth/signin")) {
      return redirectToDashboard(req, token.role as string);
    }
    return NextResponse.next();
  }

  // Protect dashboards by role
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      // No token → block access
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    const role = token.role as string | undefined;

    if (pathname.startsWith("/dashboard/admin") && role !== "Admin") {
      return NextResponse.redirect(new URL("/auth/forbidden", req.url));
    }
    if (pathname.startsWith("/dashboard/agent") && role !== "Agent") {
      return NextResponse.redirect(new URL("/auth/forbidden", req.url));
    }
    if (pathname.startsWith("/dashboard/foreign") && role !== "ForeignEmployee") {
      return NextResponse.redirect(new URL("/auth/forbidden", req.url));
    }
    if (pathname.startsWith("/dashboard/medical") && role !== "MedicalOrganization") {
      return NextResponse.redirect(new URL("/auth/forbidden", req.url));
    }
  }

  return NextResponse.next();
}

// Helper to redirect user to their dashboard based on role
function redirectToDashboard(req: NextRequest, role?: string) {
  let target = "/";

  switch (role) {
    case "Admin":
      target = "/dashboard/admin";
      break;
    case "Agent":
      target = "/dashboard/agent";
      break;
    case "ForeignEmployee":
      target = "/dashboard/foreign";
      break;
    case "MedicalOrganization":
      target = "/dashboard/medical";
      break;
  }

  return NextResponse.redirect(new URL(target, req.url));
}

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*", "/api/:path*"],
};
