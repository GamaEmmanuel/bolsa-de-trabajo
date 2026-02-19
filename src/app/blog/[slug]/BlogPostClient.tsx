'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Header from '../../../components/Header'
import { db } from '../../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

interface BlogPost {
  slug: string
  title: string
  content: string[]
  category: string
  date: string
  published: boolean
}

export default function BlogPostClient() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      try {
        const docRef = doc(db, 'blogPosts', slug)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setPost({ slug: docSnap.id, ...docSnap.data() } as BlogPost)
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error('Error fetching blog post:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    if (slug) fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <p className="ml-3 text-gray-600">Cargando artículo...</p>
        </div>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-20 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Artículo no encontrado</h1>
          <p className="text-gray-600 mb-6">El artículo que buscas no existe o fue removido.</p>
          <Link
            href="/blog"
            className="inline-block px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors"
          >
            Volver al Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <article className="max-w-4xl mx-auto pt-20 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
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
                Únete a Trabajo Libre y conecta con las mejores oportunidades profesionales.
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
