import { Metadata } from 'next'

export const homeMetadata: Metadata = {
  title: "Meserea - Encuentra Trabajo en Restaurantes y Hoteles | Empleos de Mesero, Chef, Cocinero",
  description: "La plataforma #1 para encontrar trabajo en restaurantes, hoteles y el sector de hospitalidad. Empleos de mesero, cocinero, chef, bartender, camarera y más. Contrata personal calificado para tu negocio en Latinoamérica.",
  keywords: [
    "empleos restaurantes",
    "trabajo mesero",
    "chef vacantes",
    "cocinero empleo",
    "hoteles trabajo",
    "hospitalidad empleo",
    "bartender vacante",
    "camarera trabajo",
    "empleo gastronomía",
    "trabajo cocina México",
    "contratar meseros",
    "buscar chef",
    "empleo hotelería",
    "trabajo servicio",
    "vacantes restaurantes CDMX"
  ],
  authors: [{ name: "Meserea" }],
  openGraph: {
    title: "Meserea - Empleos en Restaurantes y Hoteles",
    description: "Encuentra trabajo como mesero, chef, cocinero, bartender o camarera. La plataforma especializada en hospitalidad de Latinoamérica.",
    type: "website",
    locale: "es_MX",
    url: "https://meserea.com",
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
  alternates: {
    canonical: "https://meserea.com",
  },
}

