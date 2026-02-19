import { Metadata } from 'next'
import PricingPageClient from './PricingPageClient'

export const metadata: Metadata = {
  title: "Precios y Planes | Trabajo Libre - Plataforma de Reclutamiento",
  description: "Publica vacantes por solo $10 MXN cada una. Sin suscripciones, sin cargos mensuales. Paga solo por lo que publicas.",
  keywords: ["precios reclutamiento", "publicar vacantes costo", "plataforma empleos precios", "bolsa de trabajo precios", "publicar empleo México"],
  openGraph: {
    title: "Precios y Planes | Trabajo Libre",
    description: "Publica vacantes por solo $10 MXN cada una. Sin suscripciones, sin cargos mensuales.",
    type: "website",
    locale: "es_MX",
    url: "https://meserea.com/pricing",
    siteName: "Trabajo Libre",
  },
  twitter: {
    card: "summary_large_image",
    title: "Precios y Planes | Trabajo Libre",
    description: "Publica vacantes por solo $10 MXN cada una. Sin suscripciones, sin cargos mensuales.",
  },
  alternates: {
    canonical: "https://meserea.com/pricing",
  },
}

export default function PricingPage() {
  return <PricingPageClient />
}
