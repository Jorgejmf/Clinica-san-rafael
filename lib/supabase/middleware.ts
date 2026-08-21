import { NextResponse } from "next/server";

/**
 * Simple middleware that allows all requests without checking Supabase auth.
 * This is used because login is handled via a hard‑coded whitelist and does not
 * create a Supabase session. The original authentication middleware would cause
 * redirects back to /login, resulting in an infinite loop.
 */
export async function updateSession() {
  // No session handling – just continue.
  return NextResponse.next();
}
