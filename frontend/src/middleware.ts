import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access-token')?.value;
    const { pathname } = request.nextUrl;

    // Protected routes that REQUIRE a token
    const isProtectedRoute = pathname.startsWith('/dashboard') || 
                             pathname.startsWith('/groups') || 
                             pathname.startsWith('/settings') || 
                             pathname.startsWith('/settlements');

    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Allow the user to visit login even if a token exists (to handle stale sessions)
    // We only redirect to dashboard if they are on /login AND have a token 
    // AND they aren't coming from an error state.
    const isLoginPage = pathname.startsWith('/login');
    const hasAuthError = request.nextUrl.searchParams.has('error');

    if (isLoginPage && token && !hasAuthError) {
        // Only redirect if they are actually logged in (optional check)
        // return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/groups/:path*', '/settings/:path*', '/settlements/:path*', '/login'],
};
