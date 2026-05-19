//Middleware
import { NextResponse } from 'next/server';
export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/adminDashboard', request.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: ['/admin'],
};
