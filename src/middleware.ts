import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTE_PAGE_PERMISSION_MAP } from "@/lib/permissions";

// We can implement a simple custom route matcher matching clerk's createRouteMatcher
function createRouteMatcher(routes: string[]) {
  return (req: NextRequest) => {
    return routes.some((route) => {
      const regexStr = route.replace(/\(\.\*\)/g, ".*");
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
]);

export async function middleware(request: NextRequest) {
  const staffToken = request.cookies.get("staff_token")?.value;
  const customToken = request.cookies.get("kravy_auth_token")?.value;
  const staffRefreshToken = request.cookies.get("staff_refresh_token")?.value;
  const customRefreshToken = request.cookies.get("kravy_refresh_token")?.value;

  // 1. Redirect to dashboard if already logged in (for auth pages)
  if (
    (customToken || customRefreshToken || staffToken || staffRefreshToken) &&
    request.nextUrl.pathname.startsWith("/auth/custom")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Resolve token payload for Staff vs Custom Auth Users
  const effectiveToken = staffToken || customToken;
  let tokenPayload: any = null;
  if (effectiveToken) {
    try {
      const parts = effectiveToken.split(".");
      if (parts.length >= 2) {
        // Base64URL decode compatible with Edge runtime
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        );
        tokenPayload = JSON.parse(jsonPayload);
      }
    } catch {
      tokenPayload = null;
    }
  }

  const isStaffUser = Boolean(
    staffToken || staffRefreshToken || (tokenPayload && tokenPayload.isStaff),
  );

  // If staff user is accessing dashboard subpages, enforce page permissions
  if (isStaffUser && request.nextUrl.pathname.startsWith("/dashboard")) {
    const pathname = request.nextUrl.pathname;

    // Allow /dashboard/no-access freely so unauthorized users can see the explanation.
    // Also allow /dashboard/print routes freely in middleware because printing is governed by
    // granular format-specific permissions (A4, 80mm, 58mm, receipt, GRC) enforced on the server/API.
    if (pathname !== "/dashboard/no-access" && !pathname.startsWith("/dashboard/print")) {
      const staffPermissions: string[] = Array.isArray(
        tokenPayload?.permissions,
      )
        ? tokenPayload.permissions
        : [];
      const staffRole = tokenPayload?.role || "";
      const isAdminRole = staffRole === "ADMIN" || staffRole === "OWNER";

      if (!isAdminRole) {
        // Check route permission
        const matchedRoute = Object.keys(ROUTE_PAGE_PERMISSION_MAP).find(
          (route) => {
            if (route === "/dashboard") return pathname === "/dashboard";
            return pathname === route || pathname.startsWith(`${route}/`);
          },
        );

        const requiredPermission = matchedRoute
          ? ROUTE_PAGE_PERMISSION_MAP[matchedRoute]
          : "page:dashboard";
        const hasAccess = staffPermissions.includes(requiredPermission);

        if (!hasAccess) {
          // If staff has no access to the requested page, redirect to their authorized landing page or no-access
          let redirectUrl = "/dashboard/no-access";
          const permissionPriority = [
            { perm: "page:dashboard", url: "/dashboard" },
            { perm: "page:checkin", url: "/dashboard/checkin" },
            { perm: "page:housekeeping", url: "/dashboard/housekeeping" },
            { perm: "page:reservations", url: "/dashboard/reservations" },
            { perm: "page:rooms", url: "/dashboard/rooms" },
            { perm: "page:services", url: "/dashboard/services" },
            { perm: "page:floors", url: "/dashboard/floors" },
            { perm: "page:staff", url: "/dashboard/staff" },
            { perm: "page:reports", url: "/dashboard/reports" },
            { perm: "page:expenses", url: "/dashboard/expenses" },
            { perm: "page:settings", url: "/dashboard/settings" },
          ];

          for (const item of permissionPriority) {
            if (staffPermissions.includes(item.perm)) {
              redirectUrl = item.url;
              break;
            }
          }

          // Avoid redirect loop if target matches current pathname
          if (redirectUrl !== pathname) {
            return NextResponse.redirect(new URL(redirectUrl, request.url));
          } else {
            return NextResponse.redirect(
              new URL("/dashboard/no-access", request.url),
            );
          }
        }
      }
    }
  }

  // 3. Allow access for Custom Auth Users / Staff
  if (customToken || customRefreshToken || staffToken || staffRefreshToken) {
    return NextResponse.next();
  }

  // 4. Allow Public Routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // 5. If not authenticated and not a public route, redirect to CUSTOM auth page
  if (
    !isPublicRoute(request) &&
    !customToken &&
    !staffToken &&
    !customRefreshToken &&
    !staffRefreshToken
  ) {
    if (request.nextUrl.pathname.startsWith("/api/hotel/services")) {
      return NextResponse.next();
    }
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = new URL("/auth/custom", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
