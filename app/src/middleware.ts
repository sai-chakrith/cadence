import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const DEMO_SECRET = process.env.NEXTAUTH_SECRET || "goalpulse-demo-secret";

export async function middleware(req) {
  const token = await getToken({ req, secret: DEMO_SECRET });
  if (token) return NextResponse.next();

  const callbackUrl = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
