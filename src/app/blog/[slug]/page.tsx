import type { Metadata } from 'next'
import { db } from '../../../lib/firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { SITE_NAME, BASE_URL } from '../../../lib/constants'
import BlogPostClient from './BlogPostClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getBlogPost(slug: string) {
  try {
    const docRef = doc(db, 'blogPosts', slug)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    return { slug: docSnap.id, ...docSnap.data() } as {
      slug: string
      title: string
      content: string[]
      category: string
      date: string
      published: boolean
    }
  } catch {
    return null
  }
}

export async function generateStaticParams() {
  try {
    const snapshot = await getDocs(collection(db, 'blogPosts'))
    return snapshot.docs
      .filter((d) => d.data().published !== false)
      .map((d) => ({ slug: d.id }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return {
      title: `Artículo no encontrado | Blog ${SITE_NAME}`,
      description: 'El artículo que buscas no existe o fue removido.',
    }
  }

  const title = `${post.title} | Blog ${SITE_NAME}`
  const firstParagraph = post.content?.find((p) => !p.startsWith('**')) || ''
  const description = firstParagraph.substring(0, 160)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${BASE_URL}/blog/${slug}`,
      siteName: SITE_NAME,
      locale: 'es_MX',
      publishedTime: post.date,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  const articleSchema = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        datePublished: post.date,
        author: { '@type': 'Organization', name: SITE_NAME },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
        },
        mainEntityOfPage: `${BASE_URL}/blog/${slug}`,
        articleSection: post.category,
      }
    : null

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      <BlogPostClient />
    </>
  )
}
