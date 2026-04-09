"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Check, ArrowLeft, User, Sparkles } from "lucide-react";

interface PublicService {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
}

interface ProProfile {
  name: string;
  business: string;
}

export default function BookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [step, setStep] = useState<"service" | "datetime" | "info" | "done">("service");

  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("id, name, business")
        .eq("booking_slug", slug)
        .single();

      if (!prof) { setError(true); setLoading(false); return; }
      setProfile({ name: prof.name, business: prof.business });

      const { data: svcs } = await supabase
        .from("services")
        .select("id, name, duration, price, description")
        .eq("user_id", prof.id)
        .eq("active", true);

      setServices(svcs || []);
      setLoading(false);
    }
    load();
  }, [slug]);

  const service = services.find((s) => s.id === selectedService);

  // Generate available dates (next 14 days)
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split("T")[0];
  });

  // Generate time slots
  const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

  async function handleBook() {
    if (!selectedService || !selectedDate || !selectedTime || !clientName.trim()) return;

    // Find the pro user ID
    const { data: prof } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("booking_slug", slug)
      .single();

    if (!prof) return;

    // Create appointment directly
    await supabase.from("appointments").insert({
      user_id: prof.id,
      client_id: null,
      title: `${service?.name || "RDV"} - ${clientName.trim()}`,
      date: selectedDate,
      time: selectedTime,
      duration: service?.duration || 60,
      status: "confirmed",
      price: service?.price || 0,
      notes: `Réservation en ligne\nTél: ${clientPhone}`,
    });

    setStep("done");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="skeleton w-12 h-12 rounded-2xl mx-auto mb-3" />
          <div className="skeleton w-32 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[16px] font-bold text-foreground mb-2">Page introuvable</p>
          <p className="text-[13px] text-muted">Ce lien de réservation n&apos;existe pas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-3 shadow-apple">
            <User size={28} className="text-white" />
          </div>
          <h1 className="text-[20px] font-bold text-foreground">{profile.name}</h1>
          {profile.business && <p className="text-[13px] text-muted mt-0.5">{profile.business}</p>}
        </div>

        {/* Step: Service selection */}
        {step === "service" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="section-label mb-3">Choisir un service</p>
            {services.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-apple text-center">
                <p className="text-[14px] text-muted">Aucun service disponible.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {services.map((svc) => (
                  <motion.button key={svc.id} whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedService(svc.id); setStep("datetime"); }}
                    className={`w-full bg-white rounded-2xl p-4 shadow-apple text-left tap-scale ${selectedService === svc.id ? "ring-2 ring-accent" : ""}`}>
                    <p className="text-[14px] font-semibold text-foreground">{svc.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[12px] text-muted flex items-center gap-1"><Clock size={11} /> {svc.duration} min</span>
                      <span className="text-[13px] font-bold text-accent">{svc.price} €</span>
                    </div>
                    {svc.description && <p className="text-[11px] text-muted mt-1.5">{svc.description}</p>}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step: Date & Time */}
        {step === "datetime" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => setStep("service")} className="text-[12px] text-accent font-medium flex items-center gap-1 mb-4">
              <ArrowLeft size={14} /> Retour
            </button>

            <p className="section-label mb-3">Choisir une date</p>
            <div className="flex gap-2 overflow-x-auto pb-3 custom-scroll mb-4">
              {availableDates.map((d) => {
                const date = new Date(d);
                const isSelected = selectedDate === d;
                return (
                  <button key={d} onClick={() => setSelectedDate(d)}
                    className={`flex-shrink-0 w-[60px] py-3 rounded-xl text-center transition-all ${isSelected ? "bg-accent text-white" : "bg-white shadow-sm-apple text-foreground"}`}>
                    <p className={`text-[10px] ${isSelected ? "text-white/70" : "text-muted"}`}>{date.toLocaleDateString("fr-FR", { weekday: "short" })}</p>
                    <p className="text-[16px] font-bold mt-0.5">{date.getDate()}</p>
                    <p className={`text-[10px] ${isSelected ? "text-white/70" : "text-muted"}`}>{date.toLocaleDateString("fr-FR", { month: "short" })}</p>
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <>
                <p className="section-label mb-3">Choisir un horaire</p>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {timeSlots.map((t) => (
                    <button key={t} onClick={() => setSelectedTime(t)}
                      className={`py-2.5 rounded-xl text-[13px] font-semibold transition-all ${selectedTime === t ? "bg-accent text-white" : "bg-white shadow-sm-apple text-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}

            {selectedDate && selectedTime && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileTap={{ scale: 0.97 }}
                onClick={() => setStep("info")}
                className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold">
                Continuer
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Step: Client info */}
        {step === "info" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => setStep("datetime")} className="text-[12px] text-accent font-medium flex items-center gap-1 mb-4">
              <ArrowLeft size={14} /> Retour
            </button>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-apple mb-5">
              <p className="text-[14px] font-bold text-foreground mb-2">{service?.name}</p>
              <div className="flex items-center gap-4 text-[12px] text-muted">
                <span className="flex items-center gap-1"><CalendarDays size={12} /> {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {selectedTime}</span>
              </div>
              <p className="text-[16px] font-bold text-accent mt-2">{service?.price} €</p>
            </div>

            <p className="section-label mb-3">Vos coordonnées</p>
            <div className="space-y-3">
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Votre nom" className="input-field" />
              <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Téléphone" type="tel" className="input-field" />
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleBook}
              className="w-full bg-accent text-white py-3.5 rounded-2xl text-[14px] font-semibold mt-5">
              Confirmer la réservation
            </motion.button>
          </motion.div>
        )}

        {/* Done */}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-success-soft flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-success" />
            </div>
            <h2 className="text-[20px] font-bold text-foreground mb-2">Réservation confirmée !</h2>
            <p className="text-[13px] text-muted mb-1">{service?.name}</p>
            <p className="text-[13px] text-muted">
              {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à {selectedTime}
            </p>
            <p className="text-[11px] text-subtle mt-4">{profile.name} vous confirmera le rendez-vous.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
