'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import { db } from '../../lib/firebase'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'

interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  published: boolean
}

export default function BlogPageClient() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        // Try compound query first (requires composite index + rules)
        const q = query(
          collection(db, 'blogPosts'),
          where('published', '==', true),
          orderBy('date', 'desc')
        )
        const snapshot = await getDocs(q)
        const data: BlogPost[] = []
        snapshot.forEach(doc => {
          data.push({ slug: doc.id, ...doc.data() } as BlogPost)
        })
        setPosts(data)
      } catch {
        // Fallback: fetch all and filter/sort client-side
        try {
          const snapshot = await getDocs(collection(db, 'blogPosts'))
          const data: BlogPost[] = []
          snapshot.forEach(doc => {
            const post = { slug: doc.id, ...doc.data() } as BlogPost
            if (post.published !== false) data.push(post)
          })
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          setPosts(data)
        } catch (fallbackError) {
          console.error('Error fetching blog posts:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white pt-28 sm:pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Blog de Trabajo Libre
          </h1>
          <p className="text-xl text-pink-50">
            Consejos, guías y tendencias para profesionales y empresas
          </p>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <p className="ml-3 text-gray-600">Cargando artículos...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay artículos disponibles aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.slug}
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
        )}

        {/* Coming Soon Message */}
        {!loading && (
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Más Contenido Próximamente
            </h2>
            <p className="text-gray-600 mb-6">
              Estamos trabajando en más artículos y guías para ayudarte a crecer profesionalmente.
            </p>
            <Link
              href="/signup"
              className="inline-block px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors"
            >
              Únete a Trabajo Libre
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
