import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '../../../components/Header'

const blogPosts: Record<string, {
  title: string
  content: string[]
  category: string
  date: string
}> = {
  'contratar-mesero-perfecto': {
    title: "Cómo Contratar al Mesero Perfecto para tu Restaurante",
    category: "Guías para Empresas",
    date: "2024-12-15",
    content: [
      "Contratar al mesero adecuado puede marcar la diferencia entre un restaurante exitoso y uno que lucha por retener clientes. El servicio es uno de los pilares fundamentales de la experiencia gastronómica.",
      "En esta guía, exploraremos las claves para identificar, entrevistar y contratar meseros que eleven tu servicio al siguiente nivel.",
      "**1. Define el Perfil Ideal**\n\nAntes de comenzar el proceso de contratación, es esencial definir qué características buscas en un mesero. Considera factores como experiencia previa, habilidades de comunicación, capacidad para trabajar bajo presión y actitud hacia el servicio al cliente.",
      "**2. Experiencia vs. Actitud**\n\nSi bien la experiencia es valiosa, la actitud y disposición para aprender pueden ser igual de importantes. Un mesero con la actitud correcta puede entrenarse en las técnicas específicas de tu restaurante.",
      "**3. Proceso de Entrevista Efectivo**\n\nRealiza entrevistas que vayan más allá de las preguntas estándar. Plantea escenarios reales que podrían enfrentar en tu restaurante y evalúa cómo responderían.",
      "**4. Prueba Práctica**\n\nConsidera incluir una jornada de prueba o período de capacitación inicial donde puedas observar al candidato en acción antes de tomar una decisión final.",
      "**5. Referencias y Antecedentes**\n\nVerifica siempre las referencias laborales anteriores. Contacta a empleadores previos para conocer su desempeño y confiabilidad.",
    ],
  },
  'habilidades-chefs-profesionales': {
    title: "10 Habilidades Esenciales para Chefs Profesionales",
    category: "Desarrollo Profesional",
    date: "2024-12-10",
    content: [
      "La industria gastronómica moderna exige más que solo saber cocinar. Los chefs exitosos combinan habilidades técnicas con competencias de gestión y liderazgo.",
      "**1. Dominio de Técnicas Culinarias**\n\nDesde técnicas básicas hasta métodos avanzados de cocción, un chef profesional debe tener un repertorio amplio de habilidades técnicas.",
      "**2. Creatividad e Innovación**\n\nLa capacidad de crear platos únicos y presentaciones atractivas que sorprendan a los comensales.",
      "**3. Gestión del Tiempo**\n\nEn una cocina profesional, cada segundo cuenta. La habilidad de coordinar múltiples platos simultáneamente es crucial.",
      "**4. Liderazgo de Equipo**\n\nUn chef no solo cocina, también dirige un equipo. Las habilidades de comunicación y liderazgo son fundamentales.",
      "**5. Control de Costos**\n\nEntender los aspectos financieros de la cocina, desde el costeo de platillos hasta la gestión de inventarios.",
      "**6. Conocimiento de Seguridad Alimentaria**\n\nEl manejo higiénico de alimentos y el cumplimiento de normativas sanitarias son imprescindibles.",
      "**7. Adaptabilidad**\n\nLa capacidad de ajustarse a situaciones inesperadas y resolver problemas sobre la marcha.",
      "**8. Pasión por el Aprendizaje**\n\nLa gastronomía evoluciona constantemente. Los mejores chefs nunca dejan de aprender.",
      "**9. Resistencia al Estrés**\n\nLas cocinas profesionales son ambientes de alta presión. Mantener la calma es esencial.",
      "**10. Visión de Negocio**\n\nEntender el restaurante como negocio, no solo como un espacio creativo.",
    ],
  },
  'tendencias-hospitalidad-2025': {
    title: "Tendencias en Hospitalidad 2025: Qué Esperar",
    category: "Tendencias",
    date: "2024-12-05",
    content: [
      "El sector de hospitalidad está en constante evolución. Este año trae consigo cambios significativos en cómo operan restaurantes y hoteles.",
      "**1. Tecnología en el Servicio**\n\nLa adopción de sistemas de pedido digital, menús con código QR y aplicaciones de gestión continúa creciendo.",
      "**2. Sostenibilidad**\n\nLos consumidores valoran cada vez más las prácticas sostenibles. Desde menús plant-based hasta reducción de desperdicios.",
      "**3. Experiencias Personalizadas**\n\nEl uso de datos para ofrecer experiencias más personalizadas a los clientes.",
      "**4. Modelos de Trabajo Flexibles**\n\nLa industria está adaptándose a nuevas expectativas laborales con horarios más flexibles y mejor balance vida-trabajo.",
      "**5. Cocinas Fantasma y Delivery**\n\nEl modelo de cocinas exclusivas para delivery sigue expandiéndose.",
      "**6. Wellness y Alimentación Saludable**\n\nCreciente demanda por opciones saludables y transparencia en ingredientes.",
      "**7. Automatización en Cocina**\n\nRobots y equipos automatizados comienzan a aparecer en cocinas profesionales.",
      "**8. Contratación Digital**\n\nPlataformas especializadas como Meserea facilitan la búsqueda y contratación de personal calificado en tiempo record.",
    ],
  },
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = blogPosts[params.slug]

  if (!post) {
    return {
      title: 'Artículo no encontrado | Meserea',
    }
  }

  return {
    title: `${post.title} | Blog Meserea`,
    description: post.content[0],
    openGraph: {
      title: post.title,
      description: post.content[0],
      type: 'article',
      publishedTime: post.date,
      authors: ['Meserea'],
    },
    alternates: {
      canonical: `https://meserea.com/blog/${params.slug}`,
    },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts[params.slug]

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <article className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-6"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver al Blog
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-semibold text-pink-600 uppercase">
              {post.category}
            </span>
            <time className="text-sm text-gray-500">
              {new Date(post.date).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            {post.title}
          </h1>

          <div className="prose prose-lg max-w-none">
            {post.content.map((paragraph, index) => {
              // Check if paragraph is a heading
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                const text = paragraph.replace(/\*\*/g, '')
                return (
                  <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                    {text}
                  </h2>
                )
              }
              return (
                <p key={index} className="text-gray-600 leading-relaxed mb-6">
                  {paragraph}
                </p>
              )
            })}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-pink-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                ¿Listo para dar el siguiente paso?
              </h3>
              <p className="text-gray-600 mb-4">
                Únete a Meserea y conecta con las mejores oportunidades en hospitalidad.
              </p>
              <Link
                href="/signup"
                className="inline-block px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors"
              >
                Comenzar Ahora
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}

