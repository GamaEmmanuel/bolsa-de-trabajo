import { Metadata } from 'next'
import Link from 'next/link'
import Header from '../../components/Header'
import { generateFAQSchema } from '../../lib/structuredData'

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | Meserea - Empleos en Restaurantes y Hoteles",
  description: "Respuestas a las preguntas más comunes sobre cómo usar Meserea para encontrar trabajo en restaurantes y hoteles o contratar personal de hospitalidad.",
  alternates: {
    canonical: "https://meserea.com/faq",
  },
}

const faqs = [
  {
    question: "¿Qué es Meserea?",
    answer: "Meserea es la plataforma #1 para conectar restaurantes, hoteles y negocios de hospitalidad con personal calificado. Ayudamos a empresas a encontrar meseros, cocineros, chefs, bartenders, camareras y más profesionales del sector."
  },
  {
    question: "¿Cómo funciona para los candidatos?",
    answer: "Como candidato, puedes crear tu perfil profesional gratuitamente, buscar empleos en restaurantes y hoteles, y aplicar a las vacantes que te interesen. Recibirás notificaciones cuando haya nuevas oportunidades que coincidan con tu perfil."
  },
  {
    question: "¿Cómo funciona para las empresas?",
    answer: "Las empresas pueden publicar vacantes, revisar aplicaciones, gestionar candidatos y contratar personal calificado. Ofrecemos diferentes planes según las necesidades de contratación de tu negocio."
  },
  {
    question: "¿Cuánto cuesta usar Meserea?",
    answer: "Para candidatos, Meserea es completamente gratis. Para empresas, ofrecemos planes desde $999 MXN/mes con una prueba gratuita de 7 días. Consulta nuestra página de precios para más detalles."
  },
  {
    question: "¿En qué países está disponible Meserea?",
    answer: "Actualmente Meserea opera en México, Colombia, Argentina, Perú, Chile y Brasil, enfocándonos en el sector de hospitalidad y restaurantes en Latinoamérica."
  },
  {
    question: "¿Qué tipos de empleos puedo encontrar?",
    answer: "Ofrecemos empleos en el sector de hospitalidad incluyendo: meseros, cocineros, chefs, sous chefs, bartenders, baristas, camareras de hotel, personal de limpieza, gerentes de restaurante, hostess, ayudantes de cocina y más posiciones en restaurantes, hoteles, cafeterías y negocios de servicio."
  },
  {
    question: "¿Cómo puedo destacar mi perfil como candidato?",
    answer: "Completa tu perfil al 100%, agrega tu experiencia laboral en restaurantes o hoteles, incluye tus habilidades específicas (servicio al cliente, cocina, mixología, etc.), y mantén tu disponibilidad actualizada. Los perfiles completos reciben 5 veces más visualizaciones."
  },
  {
    question: "¿Cuánto tiempo toma el proceso de contratación?",
    answer: "Muchas empresas en Meserea contratan en menos de 24 horas. El tiempo depende de la urgencia de la vacante y el proceso de cada empresa. Algunas posiciones urgentes se llenan el mismo día."
  },
  {
    question: "¿Necesito experiencia previa para aplicar?",
    answer: "Tenemos vacantes para todos los niveles de experiencia. Algunos empleos requieren experiencia específica, mientras que otros están abiertos a personas sin experiencia previa que quieran iniciar en el sector de hospitalidad."
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
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-xl text-gray-600">
            Encuentra respuestas a las preguntas más comunes sobre Meserea
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

