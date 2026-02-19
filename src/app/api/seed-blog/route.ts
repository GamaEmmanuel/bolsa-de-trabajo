import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { BLOG_POSTS } from '../../../../scripts/seed-blog'

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 })
  }

  try {
    const batch = adminDb.batch()

    for (const post of BLOG_POSTS) {
      const ref = adminDb.collection('blogPosts').doc(post.slug)
      batch.set(ref, {
        ...post,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: `Seeded ${BLOG_POSTS.length} blog posts`,
      slugs: BLOG_POSTS.map(p => p.slug),
    })
  } catch (error: any) {
    console.error('Error seeding blog posts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
