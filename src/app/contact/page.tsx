import { Metadata } from 'next'
import ContactPageClient from './ContactPageClient'

export const metadata: Metadata = {
  title: "Contacto | Trabajo Libre - Hablemos Sobre tus Necesidades",
  description: "¿Tienes preguntas sobre cómo contratar talento para tu empresa? Contacta a nuestro equipo de soporte. Respondemos en menos de 24 horas.",
  openGraph: {
    title: "Contacto | Trabajo Libre",
    description: "Contáctanos para resolver tus dudas sobre contratación y búsqueda de empleo",
    type: "website",
    locale: "es_MX",
    url: "https://meserea.com/contact",
  },
  alternates: {
    canonical: "https://meserea.com/contact",
  },
}

export default function ContactPage() {
  return <ContactPageClient />
}
