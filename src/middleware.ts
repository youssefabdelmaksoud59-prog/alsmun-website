import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isSecretariatArea = req.nextUrl.pathname.startsWith("/secretariat");
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = isSecretariatArea ? "/login/secretariat" : "/login/chair";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  if (isSecretariatArea && session.role !== "SECRETARIAT") {
    const url = req.nextUrl.clone();
    url.pathname = "/login/secretariat";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/chair/:path*", "/secretariat/:path*", "/api/scores/:path*"],
};
