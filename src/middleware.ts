import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const SUPER_ADMIN_ONLY_PATHS = ['/organizations'];
const MANAGEMENT_PATHS = ['/users', '/churches'];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  const isPublicAuthPage =
    pathname === '/login' || pathname.startsWith('/auth/');

  if (isPublicAuthPage) {
    if (token) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const isSuperAdmin = token.isSuperAdmin as boolean | undefined;
  const activeRole = token.activeRole as string | undefined;

  if (!isSuperAdmin) {
    if (SUPER_ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (activeRole === 'officer') {
    if (MANAGEMENT_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!register|api/auth|api/registrations|api/events/by-slug|_next/static|_next/image|favicon.ico).*)',
  ],
};
