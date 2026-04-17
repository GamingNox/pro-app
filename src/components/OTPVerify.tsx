"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface OTPVerifyProps {
  email: string;
  userId?: string;
  onVerified: () => void;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export default function OTPVerify({ email, userId, onVerified, onClose, title, description }: OTPVerifyProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "sending" | "verifying" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const sendCode = useCallback(async () => {
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data?.retry_after) {
          setResendCountdown(data.retry_after);
          setErrorMsg(`Patientez ${data.retry_after}s avant de demander un nouveau code.`);
        } else {
          setErrorMsg("Impossible d'envoyer le code. Réessayez.");
        }
        setStatus("error");
        return;
      }
      setStatus("idle");
      setResendCountdown(60);
    } catch {
      setErrorMsg("Erreur réseau. Réessayez.");
      setStatus("error");
    }
  }, [email]);

  // Send a code on mount
  useEffect(() => {
    sendCode();
  }, [sendCode]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const verify = useCallback(async (code: string) => {
    setStatus("verifying");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, userId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const errKey = data?.error || "unknown";
        setErrorMsg(
          errKey === "expired" ? "Ce code a expiré. Demandez-en un nouveau."
          : errKey === "invalid_code" ? "Code incorrect. Réessayez."
          : errKey === "too_many_attempts" ? "Trop d'essais. Demandez un nouveau code."
          : errKey === "no_active_code" ? "Aucun code actif. Demandez-en un nouveau."
          : "Vérification impossible. Réessayez."
        );
        setStatus("error");
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputsRef.current[0]?.focus(), 50);
        return;
      }
      setStatus("success");
      setTimeout(onVerified, 600);
    } catch {
      setErrorMsg("Erreur réseau. Réessayez.");
      setStatus("error");
    }
  }, [email, userId, onVerified]);

  function handleDigitChange(i: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setStatus("idle");
    setErrorMsg("");

    if (v && i < 5) {
      inputsRef.current[i + 1]?.focus();
    }

    const code = next.join("");
    if (code.length === 6) {
      verify(code);
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    e.preventDefault();
    const next = pasted.padEnd(6, "").split("").slice(0, 6);
    setDigits(next);
    if (pasted.length === 6) verify(pasted);
    else inputsRef.current[pasted.length]?.focus();
  }

  const canResend = resendCountdown === 0 && status !== "sending" && status !== "verifying";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9500] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="w-full max-w-sm bg-background rounded-[28px] p-6 shadow-2xl"
          style={{ background: "linear-gradient(180deg, #FAFAF9, #FFFFFF)" }}
        >
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 380, damping: 24 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "linear-gradient(135deg, #EEF0FF, #F5F3FF)",
                boxShadow: "0 10px 24px rgba(91,79,233,0.18)",
              }}
            >
              {status === "success" ? (
                <CheckCircle2 size={26} style={{ color: "#16A34A" }} strokeWidth={2.6} />
              ) : (
                <Mail size={24} style={{ color: "#5B4FE9" }} strokeWidth={2.2} />
              )}
            </motion.div>

            <h2 className="text-[22px] font-bold text-foreground tracking-tight">
              {title || "Vérifiez votre email"}
            </h2>
            <p className="text-[13px] text-muted mt-2 leading-relaxed max-w-[280px]">
              {description || "Nous venons d'envoyer un code à 6 chiffres à"}
            </p>
            <p className="text-[13px] font-bold text-foreground mt-1">{email}</p>
          </div>

          {/* Code inputs */}
          <div className="flex justify-center gap-2 mt-6 mb-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-[46px] h-[56px] text-center text-[24px] font-bold rounded-xl bg-white outline-none transition-all"
                style={{
                  border: status === "error"
                    ? "1.5px solid #EF4444"
                    : d
                      ? "1.5px solid #5B4FE9"
                      : "1.5px solid #E4E4E7",
                  boxShadow: d ? "0 0 0 3px rgba(91,79,233,0.1)" : "none",
                }}
                disabled={status === "verifying" || status === "success"}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.p
                key={errorMsg}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-danger mt-2"
              >
                <AlertCircle size={13} /> {errorMsg}
              </motion.p>
            )}
            {status === "verifying" && (
              <motion.p
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-muted mt-2"
              >
                <Loader2 size={13} className="animate-spin" /> Vérification…
              </motion.p>
            )}
            {status === "success" && (
              <motion.p
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-1.5 text-[12px] font-semibold mt-2"
                style={{ color: "#16A34A" }}
              >
                <CheckCircle2 size={13} strokeWidth={2.6} /> Email confirmé !
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-5 flex flex-col items-center gap-2">
            <motion.button
              whileTap={canResend ? { scale: 0.97 } : undefined}
              onClick={canResend ? sendCode : undefined}
              disabled={!canResend}
              className="text-[12px] font-bold"
              style={{ color: canResend ? "#5B4FE9" : "#A1A1AA" }}
            >
              {status === "sending" ? "Envoi…" :
               resendCountdown > 0 ? `Renvoyer le code (${resendCountdown}s)` :
               "Renvoyer le code"}
            </motion.button>
            {onClose && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="text-[12px] font-semibold text-muted"
              >
                Plus tard
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
