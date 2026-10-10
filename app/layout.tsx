import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Segmentation Clients RFM | Dashboard IA Interactive",
  description: "Plateforme moderne de segmentation client RFM et clustering K-Means",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="light">
      <body className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
