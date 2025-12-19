import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { AuthProvider } from "../lib/authContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meserea - Encuentra Trabajo en Restaurantes y Hoteles | Empleos de Mesero, Chef, Cocinero",
  description: "La plataforma #1 para encontrar trabajo en restaurantes, hoteles y el sector de hospitalidad. Empleos de mesero, cocinero, chef, bartender, camarera y más. Contrata personal calificado para tu negocio.",
  keywords: ["empleos restaurantes", "trabajo mesero", "chef vacantes", "cocinero empleo", "hoteles trabajo", "hospitalidad empleo", "bartender vacante", "camarera trabajo", "empleo gastronomía"],
  authors: [{ name: "Meserea" }],
  openGraph: {
    title: "Meserea - Empleos en Restaurantes y Hoteles",
    description: "Encuentra trabajo como mesero, chef, cocinero, bartender o camarera. Plataforma especializada en hospitalidad.",
    type: "website",
    locale: "es_MX",
    siteName: "Meserea",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Meserea - Empleos en Hospitalidad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meserea - Empleos en Restaurantes y Hoteles",
    description: "Encuentra trabajo como mesero, chef, cocinero, bartender o camarera.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: "your-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Meserea",
              description: "Plataforma de empleos para restaurantes, hoteles y sector de hospitalidad en Latinoamérica",
              url: "https://meserea.com",
              logo: "https://meserea.com/logo.png",
              sameAs: [
                // Add social media URLs when available
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Service",
                availableLanguage: ["Spanish", "English"],
              },
              areaServed: {
                "@type": "Country",
                name: ["Mexico", "Colombia", "Argentina", "Peru", "Chile", "Brazil"],
              },
              serviceType: "Job Board",
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-white text-gray-900`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
