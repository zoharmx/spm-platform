import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/portal", "/crm", "/mecanico"];

// Routes that redirect authenticated users away
const AUTH_ROUTES = ["/login"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the HttpOnly session cookie set by /api/auth/session
  const sessionCookie = request.cookies.get("__session");
  const isAuthenticated = !!sessionCookie?.value;

  // Redirect authenticated users away from login
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // UX pre-check for protected routes — full token verification happens server-side.
  // This prevents unauthenticated users from seeing a flash of protected content.
  if (
    PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) &&
    !isAuthenticated
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|images|videos|api).*)",
  ],
};
