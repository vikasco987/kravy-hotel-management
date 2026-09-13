import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// We can implement a simple custom route matcher matching clerk's createRouteMatcher
function createRouteMatcher(routes: string[]) {
  return (req: NextRequest) => {
    return routes.some((route) => {
      const regexStr = route.replace(/\(\.\*\)/g, '.*');
      const regex = new RegExp(`^${regexStr}$`);
      return regex.test(req.nextUrl.pathname);
    });
  };
}

const isPublicRoute = createRouteMatcher([
  "/menu/(.*)",
  "/public/(.*)",
  "/order-tracking/(.*)",
  "/track",
  "/demo",
  "/api/public/(.*)",
  "/api/external/(.*)",
  "/api/bill-manager/(.*)/pdf",
  "/auth/custom(.*)", 
  "/api/auth/(.*)",   
  "/api/invoice/(.*)", 
  "/api/phonepe/webhook", 
  "/api/update-token", // ✅ Naya Route add kiya hai taki Token block na ho
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/staff/login",
  "/api/staff/login",
  "/qr-menu",
  "/qr-menu/(.*)",
  "/qr/(.*)",
  "/"
]);

export async function middleware(request: NextRequest) {
  const staffToken = request.cookies.get("staff_token")?.value;
  const customToken = request.cookies.get("kravy_auth_token")?.value;
  const staffRefreshToken = request.cookies.get("staff_refresh_token")?.value;
  const customRefreshToken = request.cookies.get("kravy_refresh_token")?.value;

  // 1. Redirect to dashboard if already logged in (for auth pages)
  if ((customToken || customRefreshToken) && request.nextUrl.pathname.startsWith('/auth/custom')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // 2. Allow access for Custom Auth Users
  if (customToken || customRefreshToken) {
    return NextResponse.next();
  }
  
  // 3. Allow access for Staff
  if (staffToken || staffRefreshToken) {
    if (staffToken) {
      try {
        const payloadBase64 = staffToken.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        
        // Just verify it's somewhat valid JSON
        if (payload) {
            return NextResponse.next();
        }
      } catch (e) {
        return NextResponse.redirect(new URL('/staff/login?error=invalid_session', request.url));
      }
    } else {
       // If only refresh token exists, allow navigation so client fetch interceptor can refresh it
       return NextResponse.next();
    }
  }
  
  // 4. Allow Public Routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }
  
  // 5. If not authenticated and not a public route, redirect to CUSTOM auth page
  if (!isPublicRoute(request) && !customToken && !staffToken && !customRefreshToken && !staffRefreshToken) {
    const signInUrl = new URL('/auth/custom', request.url);
    return NextResponse.redirect(signInUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
