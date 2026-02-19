import { Metadata } from 'next'
import BlogPageClient from './BlogPageClient'

export const metadata: Metadata = {
  title: "Blog | Trabajo Libre - Consejos y Guías para tu Carrera Profesional",
  description: "Artículos, consejos y guías para profesionales y empresas. Aprende sobre contratación, desarrollo profesional, tendencias laborales y crecimiento de carrera.",
  openGraph: {
    title: "Blog de Trabajo Libre",
    description: "Consejos y guías para profesionales y empresas",
    type: "website",
    locale: "es_MX",
    url: "https://meserea.com/blog",
  },
  alternates: {
    canonical: "https://meserea.com/blog",
  },
}

export default function BlogPage() {
  return <BlogPageClient />
}
