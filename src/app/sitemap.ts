import { MetadataRoute } from 'next'
import { db } from '../lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://meserea.com'

  // Static pages
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  try {
    // Fetch all published job postings
    const jobsQuery = query(
      collection(db, 'jobPostings'),
      where('status', '==', 'published')
    )

    const jobsSnapshot = await getDocs(jobsQuery)
    const jobUrls = jobsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        url: `${baseUrl}/jobs/${doc.id}`,
        lastModified: data.postedDate ? new Date(data.postedDate) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }
    })

    // Fetch all company pages with published jobs
    const companiesSet = new Set<string>()
    jobsSnapshot.docs.forEach((doc) => {
      const companyId = doc.data().companyId
      if (companyId) {
        companiesSet.add(companyId)
      }
    })

    const companyUrls = Array.from(companiesSet).map((companyId) => ({
      url: `${baseUrl}/company/${companyId}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    return [...routes, ...jobUrls, ...companyUrls]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static routes if dynamic content fails
    return routes
  }
}

