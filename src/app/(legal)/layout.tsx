export default function LegalLayout({ children }: { children: React.ReactNode }) {
  // Root <html>/<body> are overflow:hidden for the app shell. Legal pages
  // are full-document reads, so we need our own scroll container here.
  return (
    <div
      className="h-full h-[100dvh] overflow-y-auto bg-background"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {children}
    </div>
  );
}
