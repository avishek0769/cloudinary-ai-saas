import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"])

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth()
    const isAccessingDashboard = req.nextUrl.pathname == "/dashboard"
    
    if (userId && isPublicRoute(req) && !isAccessingDashboard) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    if (!userId && !isPublicRoute(req)) {
        return NextResponse.redirect(new URL("/sign-in", req.url))
    }
    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};