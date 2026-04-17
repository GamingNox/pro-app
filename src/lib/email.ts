// ══ Email helpers ════════════════════════════════════════
// Small wrapper around POST /api/send-email plus template
// builders that match the tones configured in /settings/messages.

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: { filename: string; content: string; contentType?: string }[];
}

export interface SendEmailResult {
  ok: boolean;
  delivered: boolean;
  reason?: string;
  id?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    return {
      ok: res.ok && data.ok,
      delivered: Boolean(data.delivered),
      reason: data.reason,
      id: data.id,
    };
  } catch (e) {
    console.error("[sendEmail] failed:", e);
    return { ok: false, delivered: false, reason: "network_error" };
  }
}

// ── Template variable substitution ─────────────────────
// Supports: {nom} {date} {heure} {service} {business}

export interface TemplateVars {
  nom?: string;
  date?: string;
  heure?: string;
  service?: string;
  business?: string;
}

export function fillTemplate(template: string, vars: TemplateVars): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    if (v !== undefined && v !== null) {
      out = out.split(`{${k}}`).join(String(v));
    }
  }
  return out;
}

// ── HTML wrapper ───────────────────────────────────────
// Wraps a text body in a simple violet-branded HTML shell.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function wrapHtml(opts: {
  title: string;
  body: string;
  business?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  accent?: string;
}): string {
  const accent = opts.accent || "#5B4FE9";
  const deep = "#3B30B5";
  const business = opts.business || "Client Base";
  const bodyHtml = escapeHtml(opts.body).replace(/\n/g, "<br>");

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:24px;background:#FAFAF9;font-family:-apple-system,system-ui,'Segoe UI',sans-serif;color:#18181B;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,${accent},${deep});border-radius:16px 16px 0 0;padding:24px;color:white;">
      <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;opacity:0.85;">${escapeHtml(business)}</p>
      <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;line-height:1.2;">${escapeHtml(opts.title)}</h1>
    </div>
    <div style="background:white;border:1px solid #E4E4E7;border-top:none;border-radius:0 0 16px 16px;padding:24px;">
      <p style="margin:0;font-size:14px;line-height:1.6;">${bodyHtml}</p>
      ${opts.ctaLabel && opts.ctaUrl ? `
        <div style="text-align:center;margin-top:24px;">
          <a href="${opts.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,${accent},${deep});color:white;text-decoration:none;padding:12px 24px;border-radius:12px;font-size:13px;font-weight:700;">${escapeHtml(opts.ctaLabel)}</a>
        </div>
      ` : ""}
    </div>
    <p style="text-align:center;color:#A1A1AA;font-size:11px;margin:16px 0 0;">
      Envoyé via <a href="https://clientbase.fr" style="color:${accent};text-decoration:none;font-weight:600;">clientbase.fr</a>
      <br><span style="font-size:10px;color:#C4C4CC;">Si vous ne souhaitez plus recevoir ces emails, contactez votre professionnel ou écrivez à <a href="mailto:dpo@clientbase.fr" style="color:${accent};">dpo@clientbase.fr</a>.</span>
    </p>
  </div>
</body>
</html>`;
}

// ── Convenience builders ───────────────────────────────

export function buildConfirmationEmail(opts: {
  clientName: string;
  businessName: string;
  serviceName: string;
  dateFr: string;
  timeFr: string;
  template?: string;
}) {
  const defaultTpl =
    "Bonjour {nom}, votre rendez-vous chez {business} le {date} à {heure} pour {service} est confirmé. À bientôt !";
  const body = fillTemplate(opts.template || defaultTpl, {
    nom: opts.clientName,
    business: opts.businessName,
    service: opts.serviceName,
    date: opts.dateFr,
    heure: opts.timeFr,
  });
  return {
    subject: `Rendez-vous confirmé — ${opts.businessName}`,
    html: wrapHtml({
      title: "Rendez-vous confirmé",
      business: opts.businessName,
      body,
      ctaLabel: "Voir sur Client Base",
      ctaUrl: "https://clientbase.fr",
    }),
    text: body,
  };
}

export function buildReminderEmail(opts: {
  clientName: string;
  businessName: string;
  serviceName: string;
  dateFr: string;
  timeFr: string;
  template?: string;
}) {
  const defaultTpl =
    "Rappel {nom} : votre rendez-vous pour {service} est prévu {date} à {heure}. À tout de suite !";
  const body = fillTemplate(opts.template || defaultTpl, {
    nom: opts.clientName,
    business: opts.businessName,
    service: opts.serviceName,
    date: opts.dateFr,
    heure: opts.timeFr,
  });
  return {
    subject: `Rappel — rendez-vous ${opts.dateFr}`,
    html: wrapHtml({ title: "Rappel rendez-vous", business: opts.businessName, body }),
    text: body,
  };
}

export function buildReviewRequestEmail(opts: {
  clientName: string;
  businessName: string;
  serviceName: string;
  publicUrl: string;
  template?: string;
}) {
  const defaultTpl =
    "Bonjour {nom}, merci pour votre visite chez {business} ! Nous espérons que vous avez apprécié votre {service}. Pourriez-vous partager votre expérience en quelques mots ? Votre avis nous aide énormément.";
  const body = fillTemplate(opts.template || defaultTpl, {
    nom: opts.clientName,
    business: opts.businessName,
    service: opts.serviceName,
    date: "",
    heure: "",
  });
  // Append review link hint on its own line (won't be escaped since wrapHtml
  // handles escaping, and the CTA button is a separate rendered element)
  return {
    subject: `Un petit avis ? — ${opts.businessName}`,
    html: wrapHtml({
      title: "Votre avis compte",
      business: opts.businessName,
      body: body + "\n\nC'est rapide (moins d'une minute) et ça aide beaucoup les futurs clients à nous faire confiance.",
      ctaLabel: "Laisser un avis",
      ctaUrl: `${opts.publicUrl}?review=1`,
    }),
    text: body + `\n\nLaissez votre avis : ${opts.publicUrl}?review=1`,
  };
}

export function buildInvoiceEmail(opts: {
  clientName: string;
  businessName: string;
  amount: number;
  description: string;
  invoiceId: string;
}) {
  const body = `Bonjour ${opts.clientName},

Vous trouverez ci-joint votre facture pour ${opts.description} d'un montant de ${opts.amount.toFixed(2)} €.

Merci pour votre confiance,
${opts.businessName}`;
  return {
    subject: `Votre facture — ${opts.businessName}`,
    html: wrapHtml({
      title: "Votre facture",
      business: opts.businessName,
      body,
    }),
    text: body,
  };
}
