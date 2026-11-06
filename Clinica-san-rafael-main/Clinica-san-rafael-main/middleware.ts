import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't need auth
  if (pathname.startsWith("/login")) {
    return NextResponse.next()
  }

  const clinicUser = request.cookies.get("clinic_user")?.value

  if (!clinicUser) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
