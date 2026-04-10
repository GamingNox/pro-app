import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/lib/store";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import ThemeLoader from "@/components/ThemeLoader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F5F5F7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var c=localStorage.getItem("accent-color");if(c)document.documentElement.style.setProperty("--color-accent",c)}catch(e){}` }} />
      </head>
      <body className="h-full bg-background">
        <ThemeLoader />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
