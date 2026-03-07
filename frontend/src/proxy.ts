import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const token = request.cookies.get('access-token')?.value;
    const { pathname } = request.nextUrl;

    // Protected routes
    const isProtectedRoute = pathname.startsWith('/dashboard') || 
                             pathname.startsWith('/groups') || 
                             pathname.startsWith('/settings') || 
                             pathname.startsWith('/settlements');

    // If it's a protected route and there's no token, redirect to login
    // EXCEPT for /dashboard which we allow to let client-side auth run
    if (isProtectedRoute && !token && pathname !== '/dashboard') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If they are on login and have a token, redirect to dashboard
    if (pathname === '/login' && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/groups/:path*', '/settings/:path*', '/settlements/:path*', '/login'],
};
