import { Metadata } from 'next'
import Link from 'next/link'
import Header from '../../components/Header'
import { generateFAQSchema } from '../../lib/structuredData'

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | Trabajo Libre - Bolsa de Empleo",
  description: "Respuestas a las preguntas más comunes sobre cómo usar Trabajo Libre para encontrar trabajo o contratar talento calificado.",
  alternates: {
    canonical: "https://meserea.com/faq",
  },
}

const faqs = [
  {
    question: "¿Qué es Trabajo Libre?",
    answer: "Trabajo Libre es la plataforma #1 para conectar empresas de todas las industrias con profesionales calificados. Ayudamos a empresas a encontrar el talento que necesitan de forma rápida y eficiente."
  },
  {
    question: "¿Cómo funciona para los candidatos?",
    answer: "Como candidato, puedes crear tu perfil profesional gratuitamente, buscar empleos en todas las industrias, y aplicar a las vacantes que te interesen. Recibirás notificaciones cuando haya nuevas oportunidades que coincidan con tu perfil."
  },
  {
    question: "¿Cómo funciona para las empresas?",
    answer: "Las empresas pueden publicar vacantes, revisar aplicaciones, gestionar candidatos y contratar personal calificado. Ofrecemos diferentes planes según las necesidades de contratación de tu negocio."
  },
  {
    question: "¿Cuánto cuesta usar Trabajo Libre?",
    answer: "Para candidatos, Trabajo Libre es completamente gratis. Para empresas, ofrecemos planes desde $999 MXN/mes con una prueba gratuita de 7 días. Consulta nuestra página de precios para más detalles."
  },
  {
    question: "¿En qué países está disponible Trabajo Libre?",
    answer: "Actualmente Trabajo Libre opera en México, Colombia, Argentina, Perú, Chile y Brasil, conectando empresas y profesionales en toda Latinoamérica."
  },
  {
    question: "¿Qué tipos de empleos puedo encontrar?",
    answer: "Ofrecemos empleos en todas las industrias incluyendo: tecnología, ventas, marketing, finanzas, ingeniería, diseño, salud, educación, retail, logística, construcción, hospitalidad, administración y más posiciones en empresas de todos los tamaños y sectores."
  },
  {
    question: "¿Cómo puedo destacar mi perfil como candidato?",
    answer: "Completa tu perfil al 100%, agrega tu experiencia laboral, incluye tus habilidades específicas y certificaciones, y mantén tu disponibilidad actualizada. Los perfiles completos reciben 5 veces más visualizaciones."
  },
  {
    question: "¿Cuánto tiempo toma el proceso de contratación?",
    answer: "Muchas empresas en Trabajo Libre contratan en menos de 24 horas. El tiempo depende de la urgencia de la vacante y el proceso de cada empresa. Algunas posiciones urgentes se llenan el mismo día."
  },
  {
    question: "¿Necesito experiencia previa para aplicar?",
    answer: "Tenemos vacantes para todos los niveles de experiencia. Algunos empleos requieren experiencia específica, mientras que otros están abiertos a personas sin experiencia previa que quieran iniciar su carrera profesional."
  },
  {
    question: "¿Puedo trabajar medio tiempo o por turno?",
    answer: "Sí, ofrecemos empleos de tiempo completo, medio tiempo, por turnos, fines de semana y temporales. Puedes filtrar las vacantes según tu disponibilidad."
  },
  {
    question: "¿Cómo puedo contactar al soporte?",
    answer: "Puedes contactarnos a través del chat en vivo en nuestra plataforma, enviarnos un email o llamarnos. Nuestro equipo de soporte está disponible para ayudarte."
  },
  {
    question: "¿Es seguro compartir mi información?",
    answer: "Sí, toda tu información está protegida. Solo las empresas con vacantes activas pueden ver los perfiles de candidatos, y tú controlas qué información compartes."
  },
]

export default function FAQPage() {
  const faqSchema = generateFAQSchema(faqs)

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <Header />
      <div className="max-w-4xl mx-auto pt-20 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl text-gray-600">
            Encuentra respuestas a las preguntas más comunes sobre Trabajo Libre
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {faq.question}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-pink-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Tienes más preguntas?
          </h2>
          <p className="text-gray-600 mb-6">
            Nuestro equipo está aquí para ayudarte
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors"
          >
            Contáctanos
          </Link>
        </div>
      </div>
    </div>
  )
}

