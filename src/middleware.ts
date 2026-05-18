import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET;

export async function middleware(req) {
  if (!SECRET) {
    console.error("CRITICAL: NEXTAUTH_SECRET is not set in environment.");
    return NextResponse.next(); // Or redirect to an error page
  }
  const token = await getToken({ req, secret: SECRET });
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
