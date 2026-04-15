import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/portal", "/crm", "/mecanico"];

// Routes that redirect if already authenticated
const AUTH_ROUTES = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Primary: HttpOnly session cookie created by Firebase Admin SDK (/api/auth/session)
  // Fallback: __auth presence cookie set client-side by AuthContext after Firebase auth
  // The middleware is a UX guard — actual security lives in each page's useAuth() check
  const sessionCookie = request.cookies.get("__session");
  const authPresence = request.cookies.get("__auth");
  const isAuthenticated = !!sessionCookie || !!authPresence;

  // Redirect authenticated users away from login
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // Protected routes — redirect to login if not authenticated
  // Note: Full auth is handled client-side with Firebase;
  // this is a lightweight pre-check for better UX.
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
    // Exclude static assets, API routes, and Firebase Auth handler paths (/__/auth/*)
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|images|videos|api|__/).*)",
  ],
};
