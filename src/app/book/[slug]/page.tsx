"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, X, Clock, CalendarDays, Check, User, Mail,
  Phone, FileText, Shield, Sparkles, CheckCircle2, MapPin, CreditCard, Zap,
} from "lucide-react";

interface PublicService { id: string; name: string; duration: number; price: number; description: string; }
interface ProProfile { name: string; business: string; }

type Step = 1 | 2 | 3 | 4 | 5;

const DAYS_SHORT = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

export default function BookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientFirst, setClientFirst] = useState("");
  const [clientLast, setClientLast] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNote, setClientNote] = useState("");

  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase.from("user_profiles").select("id, name, business").eq("booking_slug", slug).single();
      if (!prof) { setError(true); setLoading(false); return; }
      setProfile({ name: prof.name, business: prof.business });
      const { data: svcs } = await supabase.from("services").select("id, name, duration, price, description").eq("user_id", prof.id).eq("active", true);
      setServices(svcs || []);
      setLoading(false);
    }
    load();
  }, [slug]);

  const service = services.find((s) => s.id === selectedService);
  const progress = (step / 5) * 100;

  // Generate dates (next 14 days, grouped by week)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return d;
  });

  // Time slots with metadata
  const morningSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  const afternoonSlots = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

  async function handleBook() {
    if (!selectedService || !selectedDate || !selectedTime || !clientFirst.trim()) return;
    const { data: prof } = await supabase.from("user_profiles").select("id").eq("booking_slug", slug).single();
    if (!prof) return;
    await supabase.from("appointments").insert({
      user_id: prof.id, client_id: null,
      title: `${service?.name || "RDV"} - ${clientFirst.trim()} ${clientLast.trim()}`,
      date: selectedDate, time: selectedTime,
      duration: service?.duration || 60, status: "confirmed", price: service?.price || 0,
      notes: `Réservation en ligne\nEmail: ${clientEmail}\nTél: ${clientPhone}\n${clientNote}`,
    });
    setStep(5);
  }

  function goBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center"><div className="skeleton w-12 h-12 rounded-2xl mx-auto mb-3" /><div className="skeleton w-32 h-4 mx-auto" /></div>
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center"><p className="text-[16px] font-bold text-foreground mb-2">Page introuvable</p><p className="text-[13px] text-muted">Ce lien de réservation n&apos;existe pas.</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      {step < 5 && (
        <div className="flex-shrink-0 px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            {step > 1 ? (
              <motion.button whileTap={{ scale: 0.9 }} onClick={goBack} className="w-9 h-9 rounded-xl bg-white shadow-sm-apple flex items-center justify-center">
                <ArrowLeft size={17} className="text-foreground" />
              </motion.button>
            ) : <div className="w-9" />}
            <span className="text-[15px] font-bold text-foreground">Booking</span>
            <div className="w-9" />
          </div>
          {/* Progress */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Étape {step} sur 5</p>
            <p className="text-[10px] text-muted font-medium">{Math.round(progress)}% complété</p>
          </div>
          <div className="w-full h-[3px] bg-border-light rounded-full overflow-hidden">
            <motion.div className="h-full bg-accent rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <AnimatePresence mode="wait">

          {/* ═══ STEP 1: Service ═══ */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight mt-3">Sélectionnez votre service</h2>
              <p className="text-[13px] text-muted mt-1.5 flex items-center gap-1.5"><Zap size={13} className="text-accent" /> Moins de 30 secondes</p>

              <div className="space-y-3 mt-6">
                {services.map((svc, i) => (
                  <motion.button key={svc.id} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
                    onClick={() => { setSelectedService(svc.id); setStep(2); }}
                    className={`w-full bg-white rounded-2xl p-5 shadow-card-premium text-left ${selectedService === svc.id ? "ring-2 ring-accent" : ""}`}>
                    <p className="text-[17px] font-bold text-foreground">{svc.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[12px] text-muted flex items-center gap-1"><Clock size={12} /> {svc.duration >= 60 ? `${Math.floor(svc.duration / 60)}h${svc.duration % 60 > 0 ? ` ${svc.duration % 60}m` : ""}` : `${svc.duration}m`}</span>
                      <span className="text-[12px] text-muted flex items-center gap-1"><CreditCard size={12} /> {svc.price}€</span>
                    </div>
                    {i === 1 && <span className="text-[9px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-md uppercase tracking-wider mt-2 inline-block">Populaire</span>}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex -space-x-1.5">
                        {[0,1].map((j) => <div key={j} className="w-6 h-6 rounded-full bg-border-light border-2 border-white" />)}
                        <div className="w-6 h-6 rounded-full bg-accent-soft border-2 border-white flex items-center justify-center text-[7px] font-bold text-accent">+2</div>
                      </div>
                      <motion.div whileTap={{ scale: 0.95 }} className="bg-accent text-white text-[12px] font-bold px-4 py-2 rounded-xl">
                        Réserver
                      </motion.div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Help */}
              <div className="bg-border-light rounded-2xl p-4 mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0"><Sparkles size={18} className="text-accent" /></div>
                <div className="flex-1"><p className="text-[13px] font-bold text-foreground">Besoin d&apos;aide ?</p><p className="text-[11px] text-muted">Contactez-nous pour une offre sur-mesure.</p></div>
                <ArrowRight size={16} className="text-muted" />
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: Date & Time ═══ */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight mt-3">Choisissez un créneau</h2>
              <p className="text-[13px] text-muted mt-1.5">Les horaires sont affichés dans votre fuseau local.</p>

              {/* Date strip */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mt-5 pb-2">
                {dates.slice(0, 7).map((d) => {
                  const ds = d.toISOString().split("T")[0];
                  const isSelected = selectedDate === ds;
                  const dayIdx = (d.getDay() + 6) % 7;
                  return (
                    <motion.button key={ds} whileTap={{ scale: 0.92 }} onClick={() => setSelectedDate(ds)}
                      className={`flex-shrink-0 w-[56px] py-3 rounded-xl text-center transition-all ${isSelected ? "bg-accent text-white shadow-sm" : "bg-white shadow-sm-apple"}`}>
                      <p className={`text-[9px] font-bold ${isSelected ? "text-white/70" : "text-muted"}`}>{DAYS_SHORT[dayIdx]}</p>
                      <p className="text-[18px] font-bold mt-0.5">{d.getDate()}</p>
                    </motion.button>
                  );
                })}
              </div>

              {selectedDate && (
                <>
                  {/* Morning */}
                  <p className="text-[12px] text-muted font-semibold mt-5 mb-2.5 flex items-center gap-1.5">☀️ Créneaux du matin</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {morningSlots.map((t) => {
                      const isSel = selectedTime === t;
                      return (
                        <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setSelectedTime(t)}
                          className={`py-4 rounded-2xl text-left px-4 relative ${isSel ? "bg-white ring-2 ring-accent shadow-card-premium" : "bg-white shadow-sm-apple"}`}>
                          <p className={`text-[18px] font-bold ${isSel ? "text-accent" : "text-foreground"}`}>{t}</p>
                          {isSel && <CheckCircle2 size={18} className="text-accent absolute top-3 right-3" />}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Afternoon */}
                  <p className="text-[12px] text-muted font-semibold mt-5 mb-2.5 flex items-center gap-1.5">🌤️ Après-midi</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {afternoonSlots.map((t) => {
                      const isSel = selectedTime === t;
                      return (
                        <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setSelectedTime(t)}
                          className={`py-4 rounded-2xl text-left px-4 relative ${isSel ? "bg-white ring-2 ring-accent shadow-card-premium" : "bg-white shadow-sm-apple"}`}>
                          <p className={`text-[18px] font-bold ${isSel ? "text-accent" : "text-foreground"}`}>{t}</p>
                          {isSel && <CheckCircle2 size={18} className="text-accent absolute top-3 right-3" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}

              {selectedDate && selectedTime && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setStep(3)}
                  className="w-full bg-accent text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 mt-6 fab-shadow">
                  Suivant : Vos informations <ArrowRight size={18} />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ═══ STEP 3: Client Info ═══ */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight mt-3">Vos informations</h2>
              <p className="text-[13px] text-muted mt-1.5">Renseignez vos coordonnées pour confirmer la réservation.</p>

              <div className="space-y-4 mt-6">
                <div><label className="text-[12px] text-foreground font-semibold mb-1.5 block">Prénom</label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3"><User size={16} className="text-subtle" /><input value={clientFirst} onChange={(e) => setClientFirst(e.target.value)} placeholder="Entrez votre prénom" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" /></div></div>

                <div><label className="text-[12px] text-foreground font-semibold mb-1.5 block">Nom</label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5"><input value={clientLast} onChange={(e) => setClientLast(e.target.value)} placeholder="Entrez votre nom" className="w-full bg-transparent text-[14px] outline-none placeholder:text-subtle" /></div></div>

                <div><label className="text-[12px] text-foreground font-semibold mb-1.5 block">Adresse email</label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3"><Mail size={16} className="text-subtle" /><input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} type="email" placeholder="nom@exemple.com" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" /></div></div>

                <div><label className="text-[12px] text-foreground font-semibold mb-1.5 block">Téléphone</label>
                  <div className="bg-border-light rounded-2xl px-4 py-3.5 flex items-center gap-3"><Phone size={16} className="text-subtle" /><input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} type="tel" placeholder="+33 6 00 00 00 00" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle" /></div></div>

                <div><div className="flex items-center justify-between mb-1.5"><label className="text-[12px] text-foreground font-semibold">Note (optionnel)</label><span className="text-[10px] text-muted uppercase">Optionnel</span></div>
                  <textarea value={clientNote} onChange={(e) => setClientNote(e.target.value)} placeholder="Demandes ou détails particuliers ?" rows={3} className="w-full bg-border-light rounded-2xl px-4 py-3.5 text-[14px] outline-none resize-none placeholder:text-subtle" /></div>
              </div>

              {/* Trust badge */}
              <div className="bg-border-light rounded-2xl p-4 mt-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0"><Shield size={16} className="text-accent" /></div>
                <div><p className="text-[13px] font-bold text-foreground">Réservation sécurisée</p><p className="text-[11px] text-muted mt-0.5 leading-relaxed">Vos données sont chiffrées. Nous ne partageons jamais vos informations.</p></div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(4)}
                disabled={!clientFirst.trim()}
                className={`w-full py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 mt-5 ${clientFirst.trim() ? "bg-accent text-white fab-shadow" : "bg-border-light text-muted"}`}>
                Vérifier les détails <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* ═══ STEP 4: Review ═══ */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight mt-3">Récapitulatif</h2>
              <p className="text-[13px] text-muted mt-1.5">Vérifiez les détails avant de confirmer.</p>

              <div className="space-y-3 mt-6">
                {/* Service */}
                <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <div className="flex items-center justify-between">
                    <div><p className="text-[9px] text-accent font-bold uppercase tracking-wider">Service</p><p className="text-[16px] font-bold text-foreground mt-1">{service?.name}</p></div>
                    <CheckCircle2 size={22} className="text-accent" />
                  </div>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border-light">
                    <div className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center"><User size={16} className="text-muted" /></div>
                    <div><p className="text-[13px] font-bold text-foreground">{profile.name}</p><p className="text-[10px] text-muted">{profile.business}</p></div>
                  </div>
                </div>

                {/* Appointment */}
                <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <p className="text-[9px] text-accent font-bold uppercase tracking-wider flex items-center gap-1"><CalendarDays size={10} /> Rendez-vous</p>
                  <p className="text-[16px] font-bold text-foreground mt-1">
                    {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <p className="text-[14px] text-accent font-semibold mt-0.5">{selectedTime} — {(() => {
                    const [h, m] = selectedTime.split(":").map(Number);
                    const end = new Date(0, 0, 0, h, m + (service?.duration || 60));
                    return `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
                  })()}</p>
                </div>

                {/* Guest */}
                <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <p className="text-[9px] text-accent font-bold uppercase tracking-wider flex items-center gap-1"><User size={10} /> Client</p>
                  <p className="text-[16px] font-bold text-foreground mt-1">{clientFirst} {clientLast}</p>
                  {clientEmail && <p className="text-[12px] text-muted mt-0.5">{clientEmail}</p>}
                </div>

                {/* Price */}
                <div className="bg-white rounded-2xl p-4 shadow-card-premium">
                  <div className="flex justify-between text-[13px] mb-1"><span className="text-muted">Service</span><span className="font-semibold">{service?.price?.toFixed(2)} €</span></div>
                  <div className="border-t border-border-light pt-2 mt-2 flex items-end justify-between">
                    <div><p className="text-[9px] text-accent font-bold uppercase tracking-wider">Total</p><p className="text-[24px] font-bold text-foreground">{service?.price?.toFixed(2)} €</p></div>
                    <span className="text-[10px] font-bold text-accent bg-accent-soft px-2.5 py-1 rounded-lg flex items-center gap-1"><Zap size={9} /> Confirmation instantanée</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted text-center mt-4 flex items-center justify-center gap-1"><Shield size={10} /> Sécurisé & instantané</p>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleBook}
                className="w-full bg-accent text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 mt-4 fab-shadow">
                Confirmer la réservation <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* ═══ STEP 5: Confirmation ═══ */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center pt-8 mb-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  className="w-20 h-20 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={36} className="text-accent" />
                </motion.div>
                <h2 className="text-[26px] font-bold text-foreground tracking-tight">Réservation confirmée !</h2>
                <p className="text-[14px] text-muted mt-2 max-w-[280px] mx-auto leading-relaxed">
                  Votre séance chez {profile.name} est confirmée. Les détails ont été envoyés par email.
                </p>
              </div>

              {/* Summary card */}
              <div className="bg-white rounded-2xl p-5 shadow-card-premium mb-4">
                <div className="flex items-start justify-between">
                  <div><p className="text-[9px] text-accent font-bold uppercase tracking-wider">Service</p><p className="text-[16px] font-bold text-foreground mt-1">{service?.name}</p></div>
                  <div className="text-right"><p className="text-[9px] text-muted font-bold uppercase tracking-wider">Horaire</p><p className="text-[14px] font-bold text-foreground mt-1">{selectedTime}</p></div>
                </div>
                <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-border-light">
                  <MapPin size={14} className="text-muted" />
                  <div><p className="text-[13px] font-semibold text-foreground">{profile.name}</p><p className="text-[11px] text-muted">{profile.business}</p></div>
                </div>
              </div>

              {/* Loyalty card */}
              <div className="bg-foreground rounded-2xl p-5 text-white mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div><p className="text-[15px] font-bold">Lumière Loyalty</p><p className="text-[9px] text-white/50 uppercase tracking-wider">Membre fidélité</p></div>
                  <CreditCard size={20} className="text-white/40" />
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-[28px] font-bold">4<span className="text-[14px] text-white/40">/5</span></p>
                  <p className="text-[10px] text-white/50 text-right max-w-[140px]">1 RDV avant la récompense</p>
                </div>
                <div className="flex gap-1.5 mt-3">{[1,2,3,4,5].map((i) => (<div key={i} className={`flex-1 h-1.5 rounded-full ${i <= 4 ? "bg-accent" : "bg-white/20"}`} />))}</div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }}
                className="w-full bg-accent text-white py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 fab-shadow mb-3">
                <CalendarDays size={18} /> Ajouter au calendrier
              </motion.button>
              <button className="w-full bg-border-light text-foreground py-3.5 rounded-2xl text-[14px] font-bold text-center">
                Retour à l&apos;accueil
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
