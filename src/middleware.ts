import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const SUPER_ADMIN_ONLY_PATHS = ['/organizations'];
const ADMIN_ONLY_PATHS = ['/users'];
const FINANCE_PATHS = ['/finance'];

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined;
    const title = req.nextauth.token?.title as string | undefined;
    const { pathname } = req.nextUrl;

    if (role !== 'super_admin') {
      const isBlocked = SUPER_ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
      if (isBlocked) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    if (role === 'officer') {
      const isAdminBlocked = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
      if (isAdminBlocked) {
        return NextResponse.redirect(new URL('/', req.url));
      }

      // Only Treasurer officers can access finance routes
      const isFinancePath = FINANCE_PATHS.some((p) => pathname.startsWith(p));
      if (isFinancePath && title !== 'Treasurer') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: ['/((?!login|register|api/auth|api/registrations|api/events/by-slug|_next/static|_next/image|favicon.ico).*)'],
};
