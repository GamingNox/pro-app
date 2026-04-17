import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "Inter, -apple-system, system-ui, sans-serif",
        backgroundColor: "#FAFAF9",
        color: "#18181B",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: "linear-gradient(135deg, #EEF0FF, #F5F3FF)",
          border: "1px solid #E4E4E7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          fontSize: 36,
        }}
      >
        🔍
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
        Page introuvable
      </h1>
      <p style={{ fontSize: 14, color: "#71717A", marginBottom: 28, maxWidth: 320, lineHeight: 1.6 }}>
        Cette page n&apos;existe pas ou a ete deplacee.
        Verifiez l&apos;adresse ou retournez a l&apos;accueil.
      </p>

      <Link
        href="/"
        style={{
          background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
          color: "white",
          border: "none",
          borderRadius: 14,
          padding: "13px 32px",
          fontSize: 14,
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 8px 20px rgba(91, 79, 233, 0.3)",
        }}
      >
        Retour a l&apos;accueil
      </Link>

      <div style={{ marginTop: 40, display: "flex", gap: 12, fontSize: 11, color: "#A1A1AA" }}>
        <a href="/mentions-legales" style={{ color: "#A1A1AA", textDecoration: "none" }}>Mentions legales</a>
        <span>·</span>
        <a href="/cgu" style={{ color: "#A1A1AA", textDecoration: "none" }}>CGU</a>
        <span>·</span>
        <a href="/confidentialite" style={{ color: "#A1A1AA", textDecoration: "none" }}>Confidentialite</a>
      </div>
    </div>
  );
}
