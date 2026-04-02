import { default as nextAuthMiddleware } from "next-auth/middleware"

export const proxy = nextAuthMiddleware
export default nextAuthMiddleware

export const config = {
  matcher: ["/dashboard/:path*", "/reel/:path*"],
}
