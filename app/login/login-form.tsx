"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Leaf, Mail, Sparkles } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import styles from "./login.module.css";

export function LoginForm({ isConfigured, initialError = false }: { isConfigured: boolean; initialError?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [linkError, setLinkError] = useState(initialError);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isConfigured) return;
    setLinkError(false);
    setStatus("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? "error" : "sent");
  };

  return (
    <main className={styles.page}>
      <section className={styles.story}>
        <div className={styles.brand}><span><Leaf size={20} /></span>The Pantry</div>
        <div className={styles.storyBody}>
          <span className={styles.kicker}><Sparkles size={14} /> Waste less. Cook more.</span>
          <h1>Your kitchen,<br />working together.</h1>
          <p>Know what you have, use food before it expires, and find recipes that fit your actual kitchen.</p>
          <div className={styles.foodLine}><span>🥬</span><span>🐟</span><span>🥕</span><span>🥚</span></div>
        </div>
        <small>Private by default · Built for your household</small>
      </section>
      <section className={styles.formSide}>
        <div className={styles.formCard}>
          <span className={styles.mobileBrand}><Leaf size={18} /> The Pantry</span>
          <h2>Welcome to your kitchen</h2>
          <p>We’ll email you a secure sign-in link. No password to remember.</p>
          {!isConfigured ? (
            <div className={styles.setupNote}><strong>Setup still needed</strong><span>Add the staging Supabase values from <code>.env.example</code> to enable sign-in.</span></div>
          ) : status === "sent" ? (
            <div className={styles.sent}><Mail size={24} /><strong>Check your inbox</strong><span>Use the link we sent to {email}.</span></div>
          ) : (
            <form onSubmit={submit}>
              <label><span>Email address</span><div><Mail size={17} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div></label>
              <button disabled={status === "sending" || !isConfigured}>{status === "sending" ? "Sending…" : "Email me a sign-in link"}<ArrowRight size={17} /></button>
              {status === "error" && <span className={styles.error}>We couldn’t send the link. Please check the address and try again.</span>}
              {status === "idle" && linkError && <span className={styles.error}>That sign-in link didn’t work or has expired. Request a new one below.</span>}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
