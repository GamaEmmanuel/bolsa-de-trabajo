import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { AuthProvider } from "../lib/authContext";
import { SITE_NAME, BASE_URL, DEFAULT_DESCRIPTION } from "../lib/constants";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${SITE_NAME} - Encuentra Trabajo y Talento | Bolsa de Empleo en Latinoamérica`,
  description: DEFAULT_DESCRIPTION,
  keywords: ["bolsa de empleo", "buscar trabajo", "vacantes", "empleo Latinoamérica", "contratar personal", "ofertas de trabajo", "empleo tecnología", "trabajo remoto", "empleo ventas"],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    title: `${SITE_NAME} - Bolsa de Empleo en Latinoamérica`,
    description: "Encuentra empleo o contrata talento calificado. La plataforma líder en Latinoamérica para todas las industrias.",
    type: "website",
    locale: "es_MX",
    siteName: SITE_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Bolsa de Empleo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Bolsa de Empleo en Latinoamérica`,
    description: "Encuentra empleo o contrata talento calificado en todas las industrias.",
    images: ["/og-image.png"],
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
              name: SITE_NAME,
              description: "Plataforma de empleos para todas las industrias en Latinoamérica",
              url: BASE_URL,
              logo: `${BASE_URL}/logo.png`,
              sameAs: [],
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
