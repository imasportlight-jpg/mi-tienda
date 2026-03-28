import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IMA sports lighting",
  description: "Iluminación de alto rendimiento para potenciar tu entrenamiento.",
  // Configuración para WhatsApp y redes sociales
  openGraph: {
    title: "IMA sports lighting",
    description: "Iluminación de alto rendimiento",
    url: "https://mi-tienda-xu5d.vercel.app",
    siteName: "IMA Sports",
    images: [
      {
        url: "/opengraph-image.png", 
        width: 1200,
        height: 630,
        alt: "IMA Sports Lighting Logo",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  // CONFIGURACIÓN DE ICONOS PARA PESTAÑA Y FAVORITOS DEL CELULAR
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/favicon.ico", sizes: "180x180", type: "image/x-icon" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/favicon.ico",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}