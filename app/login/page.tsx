import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (isConfigured) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  const { error } = await searchParams;
  return <LoginForm isConfigured={isConfigured} initialError={Boolean(error)} />;
}
