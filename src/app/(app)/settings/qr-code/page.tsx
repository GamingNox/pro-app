"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, Download, Printer, Copy, Check, Image as ImageIcon, CreditCard, Info, Palette,
} from "lucide-react";
import QRCode from "qrcode";
import SettingsPage, { SettingsSection } from "@/components/SettingsPage";
import { useApp } from "@/lib/store";

const COLOR_PRESETS: { key: string; label: string; fg: string; bg: string }[] = [
  { key: "violet",  label: "Violet (défaut)", fg: "#5B4FE9", bg: "#FFFFFF" },
  { key: "dark",    label: "Noir élégant",    fg: "#0A0A0A", bg: "#FFFFFF" },
  { key: "inverse", label: "Inversé",         fg: "#FFFFFF", bg: "#5B4FE9" },
  { key: "mint",    label: "Menthe",          fg: "#047857", bg: "#ECFDF5" },
  { key: "rose",    label: "Rose",            fg: "#BE185D", bg: "#FDF2F8" },
  { key: "amber",   label: "Ambre",           fg: "#B45309", bg: "#FFFBEB" },
];

const QR_SIZE = 640;

export default function SettingsQRCodePage() {
  const { user } = useApp();
  const [preset, setPreset] = useState(COLOR_PRESETS[0]);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const slug = user.bookingSlug || user.name?.replace(/\s/g, "").toLowerCase() || "pro";
  const publicUrl = `https://clientbase.fr/p/${slug}`;
  const business = user.business || user.name || "Votre profil";

  // Editable card text (persisted locally — no DB round-trip needed for a
  // "just text on my printable") so users can tune their cards without
  // going to another page.
  const [titleText, setTitleText] = useState(business);
  const [taglineText, setTaglineText] = useState("RÉSERVATION EN LIGNE");
  const [ctaText, setCtaText] = useState("Scannez pour réserver");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("qr_card_text");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.title) setTitleText(parsed.title);
        if (parsed.tagline) setTaglineText(parsed.tagline);
        if (parsed.cta) setCtaText(parsed.cta);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("qr_card_text", JSON.stringify({ title: titleText, tagline: taglineText, cta: ctaText }));
    } catch { /* ignore */ }
  }, [titleText, taglineText, ctaText]);

  // Regenerate QR every time preset changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = await QRCode.toDataURL(publicUrl, {
          errorCorrectionLevel: "H",
          margin: 2,
          width: QR_SIZE,
          color: { dark: preset.fg, light: preset.bg },
        });
        if (!cancelled) setDataUrl(url);
      } catch (e) {
        console.error("[qr] generate failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [publicUrl, preset]);

  // PNG download
  function downloadPng() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `clientbase-qr-${slug}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Copy URL
  function copyUrl() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Printable A4 sheet: 10 business cards (85×55mm), 2 columns × 5 rows
  async function downloadBusinessCardPdf() {
    setDownloadingCard(true);
    try {
      const { jsPDF } = await import("jspdf");
      // Re-generate a clean QR at higher size for print
      const qrForPrint = await QRCode.toDataURL(publicUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 512,
        color: { dark: preset.fg, light: preset.bg },
      });

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const cardW = 85;
      const cardH = 55;
      const cols = 2;
      const rows = 5;
      const gutterX = 5;
      const gutterY = 5;
      const totalW = cols * cardW + (cols - 1) * gutterX;
      const totalH = rows * cardH + (rows - 1) * gutterY;
      const offsetX = (pageW - totalW) / 2;
      const offsetY = (pageH - totalH) / 2;

      const drawCard = (x: number, y: number) => {
        // Card background
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(230, 230, 232);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "FD");

        // Violet accent strip (left side)
        doc.setFillColor(91, 79, 233);
        doc.roundedRect(x, y, 4, cardH, 2.5, 0, "F");
        // Square off the right edge of the strip
        doc.setFillColor(91, 79, 233);
        doc.rect(x + 2, y, 2, cardH, "F");

        // Business name / custom title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(24, 24, 27);
        doc.text(titleText.slice(0, 28), x + 8, y + 12);

        // Custom tagline
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(113, 113, 122);
        doc.text(taglineText.slice(0, 32).toUpperCase(), x + 8, y + 17);

        // URL
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(91, 79, 233);
        const shortUrl = `clientbase.fr/p/${slug}`;
        doc.text(shortUrl, x + 8, y + cardH - 12);

        // Call to action
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(113, 113, 122);
        doc.text(ctaText.slice(0, 40), x + 8, y + cardH - 7);

        // QR code on the right
        const qrSize = 34;
        const qrX = x + cardW - qrSize - 5;
        const qrY = y + (cardH - qrSize) / 2;
        doc.addImage(qrForPrint, "PNG", qrX, qrY, qrSize, qrSize);
      };

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * (cardW + gutterX);
          const y = offsetY + r * (cardH + gutterY);
          drawCard(x, y);
        }
      }

      // Light dashed cut marks between cards (for easy scissoring)
      doc.setDrawColor(200, 200, 205);
      doc.setLineDashPattern([1, 1], 0);
      // Vertical cut line
      const vcX = offsetX + cardW + gutterX / 2;
      doc.line(vcX, offsetY - 3, vcX, offsetY + totalH + 3);
      // Horizontal cut lines
      for (let r = 1; r < rows; r++) {
        const hcY = offsetY + r * (cardH + gutterY) - gutterY / 2;
        doc.line(offsetX - 3, hcY, offsetX + totalW + 3, hcY);
      }
      doc.setLineDashPattern([], 0);

      // Footer note
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 170);
      doc.text(
        `10 cartes de visite — ${business} — generé par clientbase.fr`,
        pageW / 2,
        pageH - 8,
        { align: "center" }
      );

      doc.save(`cartes-visite-${slug}.pdf`);
    } catch (e) {
      console.error("[qr] business card PDF failed:", e);
    }
    setDownloadingCard(false);
  }

  // Standalone poster (A6): big QR, business name, URL — for shop window
  async function downloadPosterPdf() {
    try {
      const { jsPDF } = await import("jspdf");
      const qrForPrint = await QRCode.toDataURL(publicUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 768,
        color: { dark: preset.fg, light: preset.bg },
      });
      // A6: 105 x 148 mm
      const doc = new jsPDF({ unit: "mm", format: "a6" });
      const w = 105;
      const h = 148;

      // Violet header
      doc.setFillColor(91, 79, 233);
      doc.rect(0, 0, w, 24, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(taglineText.slice(0, 30).toUpperCase(), w / 2, 15, { align: "center" });

      // Business / custom title
      doc.setTextColor(24, 24, 27);
      doc.setFontSize(18);
      doc.text(titleText.slice(0, 26), w / 2, 38, { align: "center" });

      // QR
      const qrSize = 68;
      const qrX = (w - qrSize) / 2;
      const qrY = 48;
      doc.addImage(qrForPrint, "PNG", qrX, qrY, qrSize, qrSize);

      // CTA
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(91, 79, 233);
      doc.text("SCANNEZ-MOI", w / 2, qrY + qrSize + 10, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122);
      doc.text(ctaText.slice(0, 40), w / 2, qrY + qrSize + 16, { align: "center" });

      // URL at bottom
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(91, 79, 233);
      doc.text(`clientbase.fr/p/${slug}`, w / 2, h - 10, { align: "center" });

      doc.save(`affiche-${slug}.pdf`);
    } catch (e) {
      console.error("[qr] poster PDF failed:", e);
    }
  }

  const previewSize = useMemo(() => 200, []);

  return (
    <SettingsPage
      category="Marketing offline"
      title="QR Code & Carte de visite"
      description="Générez un QR code qui pointe vers votre page publique, et imprimez vos cartes de visite en un clic."
    >
      {/* ── Live QR preview ────────────────────────── */}
      <div className="rounded-[22px] p-5 mb-5 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))",
          boxShadow: "0 14px 36px color-mix(in srgb, var(--color-primary) 35%, transparent)",
        }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-12 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <QrCode size={14} className="text-white" strokeWidth={2.5} />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">Votre QR code</p>
          </div>
          <h2 className="text-[20px] font-bold tracking-tight leading-tight">{business}</h2>
          <p className="text-[12px] text-white/85 mt-1.5 leading-relaxed">
            Scannez-le pour tester — il pointe vers votre page publique de réservation.
          </p>

          {/* QR preview in white card */}
          <div className="mt-4 bg-white rounded-2xl p-5 flex flex-col items-center">
            <AnimatePresence mode="wait">
              {dataUrl ? (
                <motion.img
                  key={preset.key}
                  src={dataUrl}
                  alt="QR code"
                  width={previewSize}
                  height={previewSize}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ width: previewSize, height: previewSize }}
                />
              ) : (
                <div style={{ width: previewSize, height: previewSize }} className="animate-pulse bg-border-light rounded-xl" />
              )}
            </AnimatePresence>
            <p className="text-[11px] text-muted mt-3 font-semibold truncate max-w-full">{publicUrl}</p>
            <button
              onClick={copyUrl}
              className="mt-2 text-[10px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-deep)" }}
            >
              {copied ? <><Check size={10} strokeWidth={3} /> Copié !</> : <><Copy size={10} strokeWidth={2.8} /> Copier l&apos;URL</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Text customization ──────────────────────── */}
      <SettingsSection
        title="Texte de votre carte"
        description="Personnalisez ce qui apparaît sur votre carte et votre affichette."
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Titre principal</label>
            <input
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              placeholder="Nom de votre établissement"
              maxLength={28}
              className="input-field"
            />
            <p className="text-[11px] text-muted mt-1">{titleText.length}/28 caractères</p>
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Sous-titre</label>
            <input
              value={taglineText}
              onChange={(e) => setTaglineText(e.target.value)}
              placeholder="Ex : RÉSERVATION EN LIGNE"
              maxLength={30}
              className="input-field"
            />
            <p className="text-[11px] text-muted mt-1">{taglineText.length}/30 caractères</p>
          </div>
          <div>
            <label className="text-[11px] text-muted font-bold uppercase tracking-wider mb-1.5 block">Message en bas</label>
            <input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Ex : Scannez pour réserver"
              maxLength={40}
              className="input-field"
            />
            <p className="text-[11px] text-muted mt-1">{ctaText.length}/40 caractères</p>
          </div>
        </div>
      </SettingsSection>

      {/* ── Color customization ─────────────────────── */}
      <SettingsSection title="Couleur" description="Choisissez un style assorti à votre marque.">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--color-accent-soft)" }}>
            <Palette size={15} className="text-accent" strokeWidth={2.4} />
          </div>
          <p className="text-[13px] font-bold text-accent">Préréglages</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {COLOR_PRESETS.map((p) => {
            const active = preset.key === p.key;
            return (
              <motion.button
                key={p.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPreset(p)}
                className="rounded-2xl p-3 flex items-center gap-3 text-left transition-all"
                style={{
                  backgroundColor: active ? "var(--color-primary-soft)" : "#FFFFFF",
                  border: active ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                  boxShadow: active ? "0 8px 20px color-mix(in srgb, var(--color-primary) 18%, transparent)" : "none",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: p.bg, border: "1px solid #E4E4E7" }}
                >
                  <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: p.fg }} />
                </div>
                <p className="text-[12px] font-bold text-foreground leading-tight flex-1">{p.label}</p>
                {active && <Check size={14} className="flex-shrink-0" style={{ color: "var(--color-primary)" }} strokeWidth={3} />}
              </motion.button>
            );
          })}
        </div>
      </SettingsSection>

      {/* ── Downloads ──────────────────────────────── */}
      <SettingsSection title="Téléchargements" description="Tous prêts à imprimer ou partager.">
        <div className="space-y-2.5">
          {/* PNG */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={downloadPng}
            disabled={!dataUrl}
            className="w-full flex items-center gap-3.5 bg-white rounded-2xl p-4 shadow-card-premium text-left disabled:opacity-50"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-primary-soft)" }}
            >
              <ImageIcon size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">QR code seul (PNG)</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                640 × 640px transparent — pour réseaux sociaux, signature email, site web.
              </p>
            </div>
            <Download size={16} className="text-muted flex-shrink-0" strokeWidth={2.4} />
          </motion.button>

          {/* Business card PDF */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={downloadBusinessCardPdf}
            disabled={!dataUrl || downloadingCard}
            className="w-full flex items-center gap-3.5 bg-white rounded-2xl p-4 shadow-card-premium text-left disabled:opacity-60"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-deep))" }}
            >
              <CreditCard size={18} className="text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">Cartes de visite (PDF A4)</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                10 cartes 85×55mm prêtes à découper — avec traits de coupe. Imprimez sur papier épais.
              </p>
            </div>
            {downloadingCard ? (
              <div className="w-4 h-4 rounded-full border-2 border-muted border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <Download size={16} className="text-muted flex-shrink-0" strokeWidth={2.4} />
            )}
          </motion.button>

          {/* Poster PDF */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={downloadPosterPdf}
            disabled={!dataUrl}
            className="w-full flex items-center gap-3.5 bg-white rounded-2xl p-4 shadow-card-premium text-left disabled:opacity-50"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-primary-soft)" }}
            >
              <Printer size={18} style={{ color: "var(--color-primary)" }} strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">Affichette vitrine (PDF A6)</p>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                Grand QR code + « Scannez-moi » — à afficher en vitrine, sur votre comptoir ou en salle d&apos;attente.
              </p>
            </div>
            <Download size={16} className="text-muted flex-shrink-0" strokeWidth={2.4} />
          </motion.button>
        </div>
      </SettingsSection>

      {/* ── Tips ───────────────────────────────────── */}
      <div className="bg-accent-soft rounded-2xl p-4">
        <div className="flex items-start gap-2.5">
          <Info size={14} className="text-accent mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[12px] font-bold text-foreground">Conseils d&apos;impression</p>
            <ul className="text-[11px] text-muted mt-1 leading-relaxed space-y-1 list-disc pl-4">
              <li>Imprimez sur du papier 300g/m² pour des cartes solides.</li>
              <li>Testez toujours le scan avec votre téléphone avant une grosse impression.</li>
              <li>Plus le QR est grand, mieux il scanne — minimum 2×2 cm.</li>
              <li>Gardez un contraste fort (foncé sur clair) pour une lecture optimale.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hidden canvas used if we ever need to rasterize client-side */}
      <canvas ref={canvasRef} className="hidden" />
    </SettingsPage>
  );
}
