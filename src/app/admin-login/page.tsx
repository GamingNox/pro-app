"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { validateEmailRequired } from "@/lib/validate";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setError("");
    const emailErr = validateEmailRequired(email);
    if (emailErr) { setError(emailErr); return; }
    if (!password.trim()) { setError("Mot de passe requis."); return; }

    setLoading(true);
    try {
      // 1) Authenticate against Supabase
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authErr || !data.user) {
        setError("Identifiants incorrects.");
        setLoading(false);
        return;
      }

      // 2) Verify the account is flagged as admin in user_profiles
      const { data: profile, error: profileErr } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .single();

      if (profileErr || !profile?.is_admin) {
        // Not an admin — sign out and refuse
        await supabase.auth.signOut();
        setError("Ce compte n'a pas les droits administrateur.");
        setLoading(false);
        return;
      }

      // 3) Grant admin session flag (layout double-checks Supabase session)
      localStorage.setItem("admin-auth", "true");
      router.replace("/admin-dashboard");
    } catch {
      setError("Connexion impossible. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto bg-background px-8 relative">
      <div className="flex-shrink-0 pt-5">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            try { sessionStorage.setItem("skip-onboarding-slides", "1"); } catch {}
            router.push("/onboarding");
          }}
          className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5"
          style={{
            border: "1px solid #E4E4E7",
            boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <ArrowLeft size={16} className="text-foreground" strokeWidth={2.4} />
          <span className="text-[13px] font-bold text-foreground">Retour</span>
        </motion.button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
              <Shield size={28} className="text-accent" />
            </div>
            <h1 className="text-[24px] font-bold text-foreground tracking-tight">Administration</h1>
            <p className="text-[13px] text-muted mt-1">Accès réservé aux administrateurs.</p>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-card-premium space-y-4">
            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                <Mail size={16} className="text-subtle" />
                <input
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  type="email"
                  autoComplete="email"
                  placeholder="admin@email.com"
                  className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Mot de passe</label>
              <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
                <Lock size={16} className="text-subtle" />
                <input
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleLogin(); }}
                />
                <button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={16} className="text-subtle" /> : <Eye size={16} className="text-subtle" />}</button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-danger text-[12px] font-semibold">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow disabled:opacity-60"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Connexion…</> : <>Connexion admin <ArrowRight size={18} /></>}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
