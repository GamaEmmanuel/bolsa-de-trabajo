import { Metadata } from 'next'
import JobSearchPageClient from './JobSearchPageClient'

export const metadata: Metadata = {
  title: "Empleos en Restaurantes y Hoteles | Mesero, Chef, Cocinero, Bartender - Meserea",
  description: "Encuentra trabajo en restaurantes, hoteles, cafeterías y el sector de hospitalidad. Ofertas de empleo para meseros, cocineros, chefs, bartenders, camareras, personal de limpieza y más. Aplica hoy.",
  keywords: ["empleos restaurantes", "trabajo mesero", "vacantes chef", "empleo cocinero", "trabajo bartender", "camarera empleo", "hospitalidad trabajo", "gastronomía empleo", "hoteles vacantes", "trabajo cocina"],
  openGraph: {
    title: "Empleos en Restaurantes y Hoteles | Meserea",
    description: "Cientos de ofertas de empleo en restaurantes, hoteles y sector de hospitalidad. Encuentra tu próximo trabajo como mesero, chef, cocinero o bartender.",
    type: "website",
    locale: "es_MX",
    url: "https://meserea.com/jobs",
    siteName: "Meserea",
  },
  twitter: {
    card: "summary_large_image",
    title: "Empleos en Restaurantes y Hoteles",
    description: "Encuentra trabajo como mesero, chef, cocinero, bartender o camarera.",
  },
  alternates: {
    canonical: "https://meserea.com/jobs",
  },
}

export default function JobSearchPage() {
  return <JobSearchPageClient />
}
