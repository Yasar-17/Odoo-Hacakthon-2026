import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/", "/signin", "/signup", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callback", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
