import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const SUPER_ADMIN_ONLY_PATHS = ['/organizations'];
const ADMIN_ONLY_PATHS = ['/users'];
const FINANCE_PATHS = ['/finance'];
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

  const role = token.role as string | undefined;
  const title = token.title as string | undefined;

  if (role !== 'super_admin') {
    if (SUPER_ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (role === 'officer') {
    if (ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const isFinancePath = FINANCE_PATHS.some((p) => pathname.startsWith(p));
    if (isFinancePath && title !== 'Treasurer') {
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
