"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { getAuthCallbackUrl } from "@/lib/auth-urls";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function resend() {
    if (!email) return;
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthCallbackUrl("/dashboard"),
      },
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("Confirmation email sent. Check your inbox.");
  }

  async function checkVerified() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.refreshSession();
    const { data } = await supabase.auth.getUser();
    setLoading(false);
    if (data.user?.email_confirmed_at) {
      window.location.href = "/dashboard";
    } else {
      setMessage("Email not confirmed yet. Click the link in your email.");
    }
  }

  return (
    <div className="card p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <Mail className="h-7 w-7 text-brand-600" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Verify your email</h1>
      <p className="mt-2 text-sm text-slate-500">
        We sent a confirmation link to <strong>{email ?? "your email"}</strong>. Click the link to
        activate your account.
      </p>
      {message && <p className="mt-4 text-sm text-brand-700">{message}</p>}
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={checkVerified}
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          I&apos;ve confirmed my email
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={loading || !email}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Resend confirmation
        </button>
      </div>
      <Link href="/login" className="mt-6 inline-block text-sm text-slate-500 hover:text-brand-600">
        Back to sign in
      </Link>
    </div>
  );
}
