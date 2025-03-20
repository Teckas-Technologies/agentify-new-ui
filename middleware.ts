import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const sessionCookie = req.cookies.get('appSession')?.value;

    if (!sessionCookie) {
        const loginUrl = new URL('/api/auth/login', req.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}
export const config = {
    matcher: ['/', '/playground', '/create', '/dashboard'],
};