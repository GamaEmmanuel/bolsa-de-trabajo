import type { Metadata } from 'next'
import { SITE_NAME, BASE_URL, DEFAULT_DESCRIPTION } from '../lib/constants'
import HomePageClient from './HomePageClient'

export const metadata: Metadata = {
  title: `${SITE_NAME} - Encuentra Trabajo y Talento | Bolsa de Empleo en Latinoamérica`,
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "bolsa de empleo", "buscar trabajo", "vacantes", "empleo Latinoamérica",
    "contratar personal", "ofertas de trabajo", "empleo tecnología", "trabajo remoto",
    "empleo ventas", "trabajo marketing", "vacantes finanzas", "empleo ingeniería",
    "trabajo diseño", "empleo salud", "vacantes México",
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    title: `${SITE_NAME} - Bolsa de Empleo en Latinoamérica`,
    description: "Encuentra empleo o contrata talento calificado. La plataforma líder en Latinoamérica para todas las industrias.",
    type: "website",
    locale: "es_MX",
    url: BASE_URL,
    siteName: SITE_NAME,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${SITE_NAME} - Bolsa de Empleo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Bolsa de Empleo en Latinoamérica`,
    description: "Encuentra empleo o contrata talento calificado en todas las industrias.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: BASE_URL },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/jobs?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HomePageClient />
    </>
  )
}
