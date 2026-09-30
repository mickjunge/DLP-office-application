import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const inputCls = "h-9 w-full px-3 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-500 focus:outline-hidden focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-800 disabled:pointer-events-none";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const sendLink = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9] px-4">
      <div className="w-full max-w-sm bg-white border border-black/[0.06] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.05)] p-6">
        <h1 className="text-base font-semibold text-gray-800">Office Hub</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sign in with your davidlewis.nl email</p>

        {sent ? (
          <p className="mt-4 text-sm text-gray-600">Check your inbox for a sign-in link.</p>
        ) : (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={e => { e.preventDefault(); if (isValidEmail) sendLink(); }}
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@davidlewis.nl"
              className={inputCls}
              autoFocus
            />
            <button
              type="submit"
              disabled={!isValidEmail || loading}
              className="h-8 inline-flex items-center justify-center gap-1.5 px-3 text-sm font-[450] rounded-lg border border-white/10 bg-neutral-700 text-white shadow-sm hover:bg-neutral-600 focus:outline-hidden transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
