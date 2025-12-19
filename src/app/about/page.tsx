import { Metadata } from 'next'
import Link from 'next/link'
import Header from '../../components/Header'

export const metadata: Metadata = {
  title: "Sobre Nosotros | Meserea - Conectando Talento con Oportunidades",
  description: "Conoce la historia de Meserea, la plataforma líder en reclutamiento para restaurantes, hoteles y el sector de hospitalidad en Latinoamérica. Nuestra misión es facilitar la conexión entre empresas y profesionales.",
  openGraph: {
    title: "Sobre Meserea",
    description: "La plataforma líder en reclutamiento para el sector de hospitalidad en Latinoamérica.",
    type: "website",
    locale: "es_MX",
    url: "https://meserea.com/about",
  },
  alternates: {
    canonical: "https://meserea.com/about",
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Sobre Meserea
          </h1>
          <p className="text-xl md:text-2xl text-pink-50">
            Conectando talento con oportunidades en el sector de hospitalidad
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Nuestra Misión</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            En Meserea, nuestra misión es revolucionar la forma en que restaurantes, hoteles y negocios
            de hospitalidad encuentran y contratan talento. Creemos que cada persona merece una
            oportunidad de desarrollarse profesionalmente, y cada negocio merece acceso a los mejores
            profesionales del sector.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            Facilitamos millones de conexiones cada mes entre empleadores y candidatos calificados,
            ayudando a construir equipos excepcionales y carreras exitosas en toda Latinoamérica.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">¿Por Qué Meserea?</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                🎯 Especialización en Hospitalidad
              </h3>
              <p className="text-gray-600 leading-relaxed">
                A diferencia de otras plataformas genéricas, nos especializamos exclusivamente en
                el sector de restaurantes, hoteles y hospitalidad. Entendemos las necesidades únicas
                de este sector.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                ⚡ Contratación Rápida
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Sabemos que en el sector de hospitalidad, cada día sin personal adecuado impacta
                directamente tu negocio. Por eso facilitamos contrataciones en horas, no en semanas.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                ✅ Candidatos Verificados
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Todos nuestros candidatos son profesionales con experiencia comprobada en el sector.
                Verificamos referencias, certificaciones y experiencia laboral.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                🌎 Alcance Latinoamericano
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Operamos en México, Colombia, Argentina, Perú, Chile y Brasil, conectando empresas
                con el mejor talento en toda la región.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-pink-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transparencia</h3>
              <p className="text-gray-600">
                Creemos en procesos claros y comunicación abierta entre empleadores y candidatos.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Excelencia</h3>
              <p className="text-gray-600">
                Nos esforzamos por ofrecer la mejor experiencia tanto para empresas como para candidatos.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inclusión</h3>
              <p className="text-gray-600">
                Promovemos oportunidades equitativas para todos, sin importar su origen o experiencia.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Innovación</h3>
              <p className="text-gray-600">
                Constantemente mejoramos nuestra tecnología para facilitar mejores conexiones.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">¿Listo para Comenzar?</h2>
          <p className="text-xl text-pink-50 mb-6">
            Únete a miles de empresas y profesionales que confían en Meserea
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup?type=company"
              className="px-6 py-3 bg-white text-pink-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Publicar Vacante
            </Link>
            <Link
              href="/signup?type=candidate"
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-pink-600 transition-colors"
            >
              Buscar Empleo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

