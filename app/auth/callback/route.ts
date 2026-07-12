import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"), url.origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}

function safeNextPath(requested: string | null, origin: string): string {
  if (!requested) return "/";
  try {
    return new URL(requested, origin).origin === origin ? requested : "/";
  } catch {
    return "/";
  }
}
