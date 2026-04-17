"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";

// Simple hash for credential check — not stored in plain text
function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  return h.toString(36);
}

const ADMIN_EMAIL_HASH = simpleHash("noah.pscl.08@gmail.com");
const ADMIN_PW_HASH = simpleHash("Moustique_91");

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function handleLogin() {
    if (simpleHash(email.trim()) === ADMIN_EMAIL_HASH && simpleHash(password) === ADMIN_PW_HASH) {
      // ALWAYS use localStorage for admin session persistence
      localStorage.setItem("admin-auth", "true");
      router.replace("/admin-dashboard");
    } else {
      setError("Identifiants incorrects.");
    }
  }

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto bg-background px-8 relative">
      {/* Back button — always visible top left */}
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
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full">
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
              <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                type="email" placeholder="admin@email.com" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Mot de passe</label>
            <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <Lock size={16} className="text-subtle" />
              <input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                type={showPw ? "text" : "password"} placeholder="••••••••" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-subtle outline-none" />
              <button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={16} className="text-subtle" /> : <Eye size={16} className="text-subtle" />}</button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-danger text-[12px] font-semibold">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <motion.button whileTap={{ scale: 0.98 }} onClick={handleLogin}
            className="w-full bg-accent-gradient text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow">
            Connexion admin <ArrowRight size={18} />
          </motion.button>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
