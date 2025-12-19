import { Metadata } from 'next'
import Link from 'next/link'
import Header from '../../components/Header'

export const metadata: Metadata = {
  title: "Blog | Meserea - Consejos y Guías para el Sector de Hospitalidad",
  description: "Artículos, consejos y guías para profesionales y empresas del sector de hospitalidad. Aprende sobre contratación, desarrollo profesional, tendencias en restaurantes y hoteles.",
  openGraph: {
    title: "Blog de Meserea",
    description: "Consejos y guías para el sector de hospitalidad",
    type: "website",
    locale: "es_MX",
    url: "https://meserea.com/blog",
  },
  alternates: {
    canonical: "https://meserea.com/blog",
  },
}

const blogPosts = [
  {
    id: 1,
    title: "Cómo Contratar al Mesero Perfecto para tu Restaurante",
    excerpt: "Descubre las claves para identificar y contratar meseros que eleven la experiencia de tus clientes y mejoren tu servicio.",
    category: "Guías para Empresas",
    date: "2024-12-15",
    slug: "contratar-mesero-perfecto",
  },
  {
    id: 2,
    title: "10 Habilidades Esenciales para Chefs Profesionales",
    excerpt: "Las competencias que todo chef debe desarrollar para destacar en la industria gastronómica moderna.",
    category: "Desarrollo Profesional",
    date: "2024-12-10",
    slug: "habilidades-chefs-profesionales",
  },
  {
    id: 3,
    title: "Tendencias en Hospitalidad 2025: Qué Esperar",
    excerpt: "Análisis de las principales tendencias que transformarán el sector de restaurantes y hoteles este año.",
    category: "Tendencias",
    date: "2024-12-05",
    slug: "tendencias-hospitalidad-2025",
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Blog de Meserea
          </h1>
          <p className="text-xl text-pink-50">
            Consejos, guías y tendencias para profesionales y empresas de hospitalidad
          </p>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-pink-600 uppercase">
                    {post.category}
                  </span>
                  <time className="text-xs text-gray-500">
                    {new Date(post.date).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-pink-600 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-pink-600 font-semibold hover:text-pink-700 transition-colors inline-flex items-center"
                >
                  Leer más
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Coming Soon Message */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Más Contenido Próximamente
          </h2>
          <p className="text-gray-600 mb-6">
            Estamos trabajando en más artículos y guías para ayudarte a crecer en el sector de hospitalidad.
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors"
          >
            Únete a Meserea
          </Link>
        </div>
      </div>
    </div>
  )
}

