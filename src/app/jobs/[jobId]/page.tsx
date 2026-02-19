import type { Metadata } from 'next'
import { db } from '../../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { generateJobPostingSchema, generateBreadcrumbSchema } from '../../../lib/structuredData'
import { SITE_NAME, BASE_URL } from '../../../lib/constants'
import JobDetailClient from './JobDetailClient'

interface PageProps {
  params: Promise<{ jobId: string }>
}

async function getJobData(jobId: string) {
  try {
    const jobDoc = await getDoc(doc(db, 'jobPostings', jobId))
    if (!jobDoc.exists()) return null

    const jobData = { jobId: jobDoc.id, ...jobDoc.data() } as any
    let companyData = null

    if (jobData.companyId) {
      try {
        const companyUserDoc = await getDoc(doc(db, 'users', jobData.companyId))
        if (companyUserDoc.exists()) {
          const userData = companyUserDoc.data()
          if (userData.companyData) {
            companyData = userData.companyData
          }
        }
      } catch {
        // Continue without company data
      }
    }

    return { job: jobData, companyData }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { jobId } = await params
  const data = await getJobData(jobId)

  if (!data) {
    return {
      title: `Empleo no encontrado | ${SITE_NAME}`,
      description: 'Este empleo no está disponible o ha sido removido.',
    }
  }

  const { job, companyData } = data
  const companyName = companyData?.companyName || job.companyName || 'Empresa'
  const title = `${job.jobTitle} - ${companyName} | ${SITE_NAME}`
  const description = `${(job.jobDescription || '').substring(0, 155)}... Aplica ahora en ${SITE_NAME}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${BASE_URL}/jobs/${jobId}`,
      siteName: SITE_NAME,
      locale: 'es_MX',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: { canonical: `${BASE_URL}/jobs/${jobId}` },
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { jobId } = await params
  const data = await getJobData(jobId)

  const jobSchema = data ? generateJobPostingSchema(data.job, data.companyData) : null
  const breadcrumbSchema = data
    ? generateBreadcrumbSchema([
        { name: 'Inicio', url: BASE_URL },
        { name: 'Empleos', url: `${BASE_URL}/jobs` },
        { name: data.job.jobTitle, url: `${BASE_URL}/jobs/${jobId}` },
      ])
    : null

  return (
    <>
      {jobSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <JobDetailClient />
    </>
  )
}
