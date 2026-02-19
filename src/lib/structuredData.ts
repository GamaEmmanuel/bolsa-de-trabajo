import { JobPosting } from '../types'
import { BASE_URL } from './constants'

export function generateJobPostingSchema(
  job: JobPosting,
  companyData?: {
    companyName?: string
    logoUrl?: string
    description?: string
  }
) {
  const baseUrl = BASE_URL

  const jobLocation = job.location || 'Location not specified'
  const hiringOrganization = {
    '@type': 'Organization',
    name: companyData?.companyName || job.companyName || 'Company',
    ...(companyData?.logoUrl && { logo: companyData.logoUrl }),
    ...(companyData?.description && { description: companyData.description }),
  }

  const employmentType = job.jobType
    ? job.jobType === 'full-time' ? 'FULL_TIME' :
      job.jobType === 'part-time' ? 'PART_TIME' :
      job.jobType === 'contract' ? 'CONTRACTOR' :
      job.jobType === 'internship' ? 'INTERN' :
      'FULL_TIME'
    : 'FULL_TIME'

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.jobTitle,
    description: job.jobDescription,
    identifier: {
      '@type': 'PropertyValue',
      name: companyData?.companyName || 'Company',
      value: job.jobId,
    },
    datePosted: job.postedDate || new Date().toISOString(),
    hiringOrganization,
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: jobLocation,
        addressCountry: 'MX',
      },
    },
    employmentType,
    ...(job.applicationDeadline && { validThrough: job.applicationDeadline }),
  }

  // Add salary if not hidden
  if (!job.isSalaryHidden && job.salaryMin && job.salaryMax) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'MXN',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: 'MONTH',
      },
    }
  }

  // Add requirements if available
  if (job.requirements && typeof job.requirements === 'string') {
    schema.qualifications = job.requirements
  }

  // Add experience requirements
  if (job.yearsOfExperience) {
    schema.experienceRequirements = {
      '@type': 'OccupationalExperienceRequirements',
      monthsOfExperience: job.yearsOfExperience === '0-1' ? 6 :
                          job.yearsOfExperience === '1-3' ? 24 :
                          job.yearsOfExperience === '3-5' ? 48 :
                          job.yearsOfExperience === '5-10' ? 84 :
                          job.yearsOfExperience === '10+' ? 120 : 0,
    }
  }

  // Add education requirements
  if (job.educationLevel && job.educationLevel !== 'no-requirement') {
    schema.educationRequirements = {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: job.educationLevel === 'high-school' ? 'high school' :
                         job.educationLevel === 'bachelor' ? 'bachelor degree' :
                         job.educationLevel === 'master' ? 'master degree' :
                         job.educationLevel === 'phd' ? 'doctoral degree' : 'unspecified',
    }
  }

  // Add skills
  if (job.requiredSkills && job.requiredSkills.length > 0) {
    schema.skills = job.requiredSkills.join(', ')
  }

  // Add benefits
  if (job.benefits && job.benefits.length > 0) {
    schema.jobBenefits = job.benefits.join(', ')
  }

  return schema
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function generateLocalBusinessSchema(business: {
  name: string
  description: string
  address?: string
  telephone?: string
  email?: string
  logo?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    ...(business.logo && { image: business.logo }),
    ...(business.telephone && { telephone: business.telephone }),
    ...(business.email && { email: business.email }),
    ...(business.address && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: business.address,
        addressCountry: 'MX',
      },
    }),
    priceRange: '$$',
  }
}

