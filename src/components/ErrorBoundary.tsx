"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary. Catches React render errors and displays
 * a recovery screen instead of a blank white page.
 *
 * Mount it around <AppProvider> in layout.tsx.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

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
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          Quelque chose s&apos;est mal passé
        </h1>
        <p style={{ fontSize: 13, color: "#71717A", marginBottom: 24, maxWidth: 320, lineHeight: 1.5 }}>
          Une erreur inattendue est survenue. Vos données sont en sécurité.
          Rechargez la page pour continuer.
        </p>

        <button
          onClick={() => window.location.reload()}
          style={{
            background: "linear-gradient(135deg, #5B4FE9, #3B30B5)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "12px 28px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(91, 79, 233, 0.3)",
          }}
        >
          Recharger la page
        </button>

        {this.state.error && (
          <details
            style={{
              marginTop: 24,
              fontSize: 10,
              color: "#A1A1AA",
              maxWidth: 360,
              textAlign: "left",
            }}
          >
            <summary style={{ cursor: "pointer", marginBottom: 4 }}>Détails techniques</summary>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontFamily: "monospace" }}>
              {this.state.error.message}
              {"\n"}
              {this.state.error.stack?.split("\n").slice(0, 5).join("\n")}
            </pre>
          </details>
        )}
      </div>
    );
  }
}
