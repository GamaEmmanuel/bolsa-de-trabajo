import { Metadata } from 'next'
import JobSearchPageClient from './JobSearchPageClient'

export const metadata: Metadata = {
  title: "Ofertas de Empleo en Todas las Industrias | Trabajo Libre - Bolsa de Trabajo",
  description: "Encuentra trabajo en tecnología, ventas, marketing, finanzas, ingeniería, diseño, salud y más. Miles de ofertas de empleo actualizadas. Aplica hoy.",
  keywords: ["ofertas de empleo", "buscar trabajo", "vacantes", "empleo tecnología", "trabajo ventas", "empleo marketing", "trabajo finanzas", "empleo ingeniería", "vacantes diseño", "trabajo remoto"],
  openGraph: {
    title: "Ofertas de Empleo | Trabajo Libre",
    description: "Miles de ofertas de empleo en todas las industrias. Encuentra tu próximo trabajo en la plataforma líder de Latinoamérica.",
    type: "website",
    locale: "es_MX",
    url: "https://meserea.com/jobs",
    siteName: "Trabajo Libre",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ofertas de Empleo | Trabajo Libre",
    description: "Encuentra trabajo en tecnología, ventas, marketing, finanzas y más sectores.",
  },
  alternates: {
    canonical: "https://meserea.com/jobs",
  },
}

export default function JobSearchPage() {
  return <JobSearchPageClient />
}
