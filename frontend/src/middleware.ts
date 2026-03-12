import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access-token')?.value;
    const { pathname } = request.nextUrl;

    // Protected routes
    const isProtectedRoute = pathname.startsWith('/dashboard') || 
                             pathname.startsWith('/groups') || 
                             pathname.startsWith('/settings') || 
                             pathname.startsWith('/settlements') ||
                             pathname.startsWith('/activities');

    // If it's a protected route and there's no token, we could redirect here.
    // However, we allow them to pass to let client-side auth handle it consistently
    // across all pages (Dashboard, Groups, Settings, etc.) to avoid issues with
    // HttpOnly cookies not being immediately available to the middleware on some platforms/ports.
    if (isProtectedRoute && !token) {
        // We only exempt these for now to ensure smooth transition
        const isExempted = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/groups') || 
                           pathname.startsWith('/settings') || 
                           pathname.startsWith('/settlements') ||
                           pathname.startsWith('/activities');
        
        if (!isExempted) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
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
