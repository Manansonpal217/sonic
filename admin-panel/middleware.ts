import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow access to login page
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // Session cookies (sessionid/csrftoken) are set by the API on its domain, so they're not
  // present when navigating on our domain. We set admin_authenticated on this domain after login.
  const isAuthenticated =
    request.cookies.has('admin_authenticated') ||
    request.cookies.has('sessionid') ||
    request.cookies.has('csrftoken');

  if (!isAuthenticated && !request.nextUrl.pathname.startsWith('/login')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};


