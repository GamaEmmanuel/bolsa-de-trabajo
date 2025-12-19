import { Metadata } from 'next'
import PricingPageClient from './PricingPageClient'

export const metadata: Metadata = {
  title: "Precios y Planes | Meserea - Plataforma de Reclutamiento para Restaurantes",
  description: "Planes accesibles para restaurantes, hoteles y negocios de hospitalidad. Publica vacantes de meseros, cocineros, chefs y más. Prueba gratis 7 días sin tarjeta de crédito.",
  keywords: ["precios reclutamiento", "planes contratación", "software restaurantes", "plataforma empleos precios", "contratar meseros costo"],
  openGraph: {
    title: "Precios y Planes | Meserea",
    description: "Planes flexibles para contratar personal de hospitalidad. Desde $999 MXN/mes. Prueba gratis 7 días.",
    type: "website",
    locale: "es_MX",
    url: "https://meserea.com/pricing",
    siteName: "Meserea",
  },
  twitter: {
    card: "summary_large_image",
    title: "Precios y Planes | Meserea",
    description: "Planes flexibles para contratar personal de hospitalidad. Desde $999 MXN/mes.",
  },
  alternates: {
    canonical: "https://meserea.com/pricing",
  },
}

export default function PricingPage() {
  return <PricingPageClient />
}
