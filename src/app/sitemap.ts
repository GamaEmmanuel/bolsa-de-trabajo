import { MetadataRoute } from 'next'
import { db } from '../lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { BASE_URL } from '../lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = BASE_URL

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  try {
    const jobsQuery = query(
      collection(db, 'jobPostings'),
      where('status', '==', 'published')
    )

    const jobsSnapshot = await getDocs(jobsQuery)
    const jobUrls: MetadataRoute.Sitemap = jobsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        url: `${baseUrl}/jobs/${doc.id}`,
        lastModified: data.postedDate ? new Date(data.postedDate) : new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }
    })

    const companiesSet = new Set<string>()
    jobsSnapshot.docs.forEach((doc) => {
      const companyId = doc.data().companyId
      if (companyId) {
        companiesSet.add(companyId)
      }
    })

    const companyUrls: MetadataRoute.Sitemap = Array.from(companiesSet).map((companyId) => ({
      url: `${baseUrl}/company/${companyId}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }))

    // Fetch all published blog posts
    const blogSnapshot = await getDocs(collection(db, 'blogPosts'))
    const blogUrls: MetadataRoute.Sitemap = blogSnapshot.docs
      .filter((doc) => doc.data().published !== false)
      .map((doc) => {
        const data = doc.data()
        return {
          url: `${baseUrl}/blog/${doc.id}`,
          lastModified: data.date ? new Date(data.date) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }
      })

    return [...routes, ...jobUrls, ...companyUrls, ...blogUrls]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return routes
  }
}

