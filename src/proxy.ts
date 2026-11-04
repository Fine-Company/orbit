import { auth } from "@/lib/auth/server";

// Everything is protected except these routes, /api/auth and the auth pages.
export default auth.middleware({
  loginUrl: "/auth/sign-in",
  publicRoutes: ["/", "/api/health"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
