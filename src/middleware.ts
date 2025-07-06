// src/middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    /*
      This matches all routes except:
        - _next/static files
        - static assets (js, css, images, etc.)
      and always runs for /api and /trpc
    */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|json|txt|xml|md|pdf|csv|woff|woff2|ttf|eot|mp4|mp3|webmanifest)$).*)",
    "/(api|trpc)(.*)",
  ],
};
