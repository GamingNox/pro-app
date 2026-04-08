"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { ArrowRight, Sparkles, CalendarDays, Users, BarChart3 } from "lucide-react";

const slides = [
  { icon: Sparkles, title: `Bienvenue sur ${APP_NAME}`, description: "Votre assistant tout-en-un pour gérer votre activité professionnelle." },
  { icon: CalendarDays, title: "Rendez-vous & Clients", description: "Gérez vos créneaux, suivez vos clients et leur historique en un seul endroit." },
  { icon: BarChart3, title: "Finances & Stock", description: "Suivez vos revenus, factures et stocks en temps réel." },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const { completeOnboarding, updateUser } = useApp();
  const router = useRouter();

  const isSlides = step < slides.length;
  const isSetup = step === slides.length;

  function next() {
    if (isSlides) { setStep((s) => s + 1); return; }
    updateUser({ name: name.trim() || "Mon Activité", business: business.trim() });
    completeOnboarding();
    router.replace("/");
  }

  function skip() {
    updateUser({ name: "Mon Activité", business: "" });
    completeOnboarding();
    router.replace("/");
  }

  return (
    <div className="h-full h-[100dvh] flex flex-col max-w-lg mx-auto bg-background">
      <div className="flex justify-end px-6 pt-4">
        <button onClick={skip} className="text-[13px] text-muted font-medium">Passer</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          {isSlides && (
            <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                className="w-20 h-20 rounded-[22px] bg-foreground flex items-center justify-center mb-8 shadow-apple">
                {(() => { const Icon = slides[step].icon; return <Icon size={32} className="text-white" />; })()}
              </motion.div>
              <h2 className="text-[24px] font-bold text-foreground mb-2">{slides[step].title}</h2>
              <p className="text-[14px] text-muted leading-relaxed max-w-[280px]">{slides[step].description}</p>
            </motion.div>
          )}
          {isSetup && (
            <motion.div key="setup" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-border-light flex items-center justify-center mb-6">
                <Users size={28} className="text-muted" />
              </div>
              <h2 className="text-[24px] font-bold text-foreground mb-1">Personnalisez</h2>
              <p className="text-[14px] text-muted mb-8">Comment souhaitez-vous être identifié ?</p>
              <div className="w-full space-y-3">
                <div>
                  <label className="text-[12px] text-muted mb-1.5 block">Votre nom ou nom d&apos;activité</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Marie Dupont"
                    className="w-full bg-white border border-border rounded-xl px-4 py-3 text-[14px] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all" />
                </div>
                <div>
                  <label className="text-[12px] text-muted mb-1.5 block">Type d&apos;activité (optionnel)</label>
                  <input type="text" value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Ex : Prothésiste ongulaire"
                    className="w-full bg-white border border-border rounded-xl px-4 py-3 text-[14px] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-8 pb-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          {[...slides, null].map((_, i) => (
            <motion.div key={i} className={`h-[4px] rounded-full ${i === step ? "bg-foreground" : "bg-border"}`}
              animate={{ width: i === step ? 24 : 6 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} />
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={next}
          className="w-full bg-accent text-white py-4 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2">
          {isSetup ? <><Sparkles size={18} /> C&apos;est parti !</> : <>Suivant <ArrowRight size={18} /></>}
        </motion.button>
      </div>
    </div>
  );
}
