import Link from 'next/link'
import type { Metadata } from 'next'
import { SITE_NAME } from '../lib/constants'

export const metadata: Metadata = {
  title: `Página no encontrada | ${SITE_NAME}`,
  description: 'La página que buscas no existe o ha sido movida.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-7xl font-bold text-pink-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors"
          >
            Ir al Inicio
          </Link>
          <Link
            href="/jobs"
            className="px-6 py-3 bg-white text-pink-600 font-semibold rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors"
          >
            Ver Empleos
          </Link>
          <Link
            href="/blog"
            className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Leer Blog
          </Link>
        </div>
      </div>
    </div>
  )
}
