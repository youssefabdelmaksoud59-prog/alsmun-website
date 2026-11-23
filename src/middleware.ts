import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  if (req.nextUrl.pathname.startsWith("/secretariat") && session.role !== "SECRETARIAT") {
    return NextResponse.redirect(new URL("/chair", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/chair/:path*", "/secretariat/:path*", "/account/:path*", "/api/scores/:path*"],
};
