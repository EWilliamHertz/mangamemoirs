import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Match all routes except:
    // - _next/static (static files)
    // - _next/image (image optimization)
    // - favicon.ico (favicon)
    // - public folder
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
