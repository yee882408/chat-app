import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Get the pathname of the request
  const { pathname } = req.nextUrl;

  // Check if the request is for a protected route
  const isProtectedRoute = pathname.startsWith('/supabase-chat');
  const isAuthRoute = pathname.startsWith('/auth');
  const isRootPath = pathname === '/';

  // Get the auth cookie and check if it contains a valid session
  const authCookie = req.cookies.get('auth-storage');
  // Also check for our backup cookie
  const backupCookie = req.cookies.get('supabase-auth-user');
  let hasSession = false;

  console.log('Middleware running for path:', pathname);
  console.log('Auth cookie exists:', !!authCookie);
  console.log('Backup cookie exists:', !!backupCookie);

  // If we have a backup cookie, we can consider the user authenticated
  if (backupCookie && backupCookie.value) {
    console.log('Backup cookie found with value:', backupCookie.value);
    hasSession = true;
  }

  if (authCookie && authCookie.value) {
    try {
      // First try to decode the cookie value
      const decodedValue = decodeURIComponent(authCookie.value);
      console.log('Cookie decoded successfully');

      // Then parse it as JSON
      const parsedValue = JSON.parse(decodedValue);
      console.log('Cookie parsed as JSON successfully');

      // Log the structure for debugging
      console.log('Cookie state exists:', !!parsedValue?.state);
      console.log('Cookie session exists:', !!parsedValue?.state?.session);

      if (parsedValue?.state?.session) {
        console.log('Session access_token exists:', !!parsedValue.state.session.access_token);
        console.log('Session expires_at:', parsedValue.state.session.expires_at);

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = parsedValue.state.session.expires_at;
        const isExpired = expiresAt && now > expiresAt;

        console.log('Current time (seconds):', now);
        console.log('Token expired:', isExpired);
      }

      // Check if it has a valid session structure - be more lenient
      // Either check for access_token or user object
      hasSession = !!(
        parsedValue &&
        parsedValue.state &&
        parsedValue.state.session &&
        parsedValue.state.session !== null &&
        (
          // Either has an access token
          parsedValue.state.session.access_token ||
          // Or has a user object
          (parsedValue.state.user && parsedValue.state.user.id)
        )
      );

      console.log('Auth cookie found, session valid:', hasSession);
    } catch (e) {
      console.error('Error parsing auth cookie:', e);
      console.error('Error details:', e instanceof Error ? e.message : String(e));
    }
  }

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // If accessing auth routes with a session, redirect to chat
  if ((isAuthRoute || isRootPath) && hasSession) {
    // Skip redirect for logout page
    if (pathname === '/auth/logout') {
      return NextResponse.next();
    }

    // Check if we're already in a redirection loop
    const currentT = req.nextUrl.searchParams.get('t');
    const currentTime = Date.now();

    // If there's a t parameter and it's recent (within last 30 seconds), don't redirect again
    if (currentT && (currentTime - parseInt(currentT)) < 30000) {
      console.log('Recent redirection detected, allowing navigation');
      return NextResponse.next();
    }

    // Add cache-busting query parameter to prevent caching issues
    const redirectUrl = new URL('/supabase-chat', req.url);
    redirectUrl.searchParams.set('t', currentTime.toString());

    console.log('Redirecting authenticated user to chat page');
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing root path without a session, redirect to login
  if (isRootPath && !hasSession) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/supabase-chat/:path*',
    '/auth/:path*',
    '/',
  ],
};
