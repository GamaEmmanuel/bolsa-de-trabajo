import { Metadata } from 'next'
import ContactPageClient from './ContactPageClient'

export const metadata: Metadata = {
  title: "Contacto | Meserea - Hablemos Sobre tus Necesidades",
  description: "¿Tienes preguntas sobre cómo contratar personal para tu restaurante u hotel? Contacta a nuestro equipo de soporte. Respondemos en menos de 24 horas.",
  openGraph: {
    title: "Contacto | Meserea",
    description: "Contáctanos para resolver tus dudas sobre contratación en hospitalidad",
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
