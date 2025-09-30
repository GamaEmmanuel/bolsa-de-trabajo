import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore'
import { db } from './firebase'

export interface ApplicationData {
  id: string
  pipelineStatus: 'applied' | 'reviewed' | 'interview' | 'offer' | 'hired' | 'rejected' | 'not_moving_forward'
  applicationDate: string
  companyId: string
  jobId: string
  candidateId: string
}

export interface JobPostingData {
  id: string
  title: string
  status: 'active' | 'paused' | 'closed'
  postedDate: Timestamp
  createdByUserId: string
}

export interface OfferData {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  createdDate: Timestamp
  companyId: string
  applicationId: string
}

export interface InterviewData {
  id: string
  status: 'scheduled' | 'completed' | 'cancelled'
  scheduledDate: Timestamp
  companyId: string
  applicationId: string
}

export interface AnalyticsData {
  funnelData: Array<{ name: string; value: number }>
  timeToHireData: Array<{ name: string; days: number }>
  applicantsTimeSeriesData: Array<{ name: string; applicants: number }>
  acceptanceRateData: Array<{ name: string; value: number }>
  totalApplications: number
  activeJobs: number
  totalHires: number
  averageTimeToHire: number
}

export async function getRecruitmentAnalytics(companyId: string): Promise<AnalyticsData> {
  try {
    // Get applications for the company
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('companyId', '==', companyId)
    )
    const applicationsSnapshot = await getDocs(applicationsQuery)
    const applications = applicationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ApplicationData))

    // Get job postings for the company
    const jobsQuery = query(
      collection(db, 'jobPostings'),
      where('createdByUserId', '==', companyId),
      orderBy('postedDate', 'desc')
    )
    const jobsSnapshot = await getDocs(jobsQuery)
    const jobPostings = jobsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JobPostingData))

    // Get offers for the company
    const offersQuery = query(
      collection(db, 'offers'),
      where('companyId', '==', companyId),
      orderBy('createdDate', 'desc')
    )
    const offersSnapshot = await getDocs(offersQuery)
    const offers = offersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OfferData))

    // Get interviews for the company
    const interviewsQuery = query(
      collection(db, 'interviews'),
      where('companyId', '==', companyId),
      orderBy('scheduledDate', 'desc')
    )
    const interviewsSnapshot = await getDocs(interviewsQuery)
    const interviews = interviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InterviewData))

    // Calculate funnel data
    const funnelData = [
      { name: 'Applied', value: applications.length },
      { name: 'Reviewed', value: applications.filter(app => ['reviewed', 'interview', 'offer', 'hired', 'rejected', 'not_moving_forward'].includes(app.pipelineStatus)).length },
      { name: 'Interview', value: applications.filter(app => ['interview', 'offer', 'hired', 'rejected', 'not_moving_forward'].includes(app.pipelineStatus)).length },
      { name: 'Offer', value: applications.filter(app => ['offer', 'hired', 'rejected', 'not_moving_forward'].includes(app.pipelineStatus)).length },
      { name: 'Hired', value: applications.filter(app => app.pipelineStatus === 'hired').length }
    ]

    // Calculate time to hire data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyHires = applications
      .filter(app => app.pipelineStatus === 'hired' && new Date(app.applicationDate) >= sixMonthsAgo)
      .reduce((acc, app) => {
        const month = new Date(app.applicationDate).toLocaleDateString('en-US', { month: 'short' })
        if (!acc[month]) {
          acc[month] = []
        }
        acc[month].push(app)
        return acc
      }, {} as Record<string, ApplicationData[]>)

    const timeToHireData = Object.entries(monthlyHires).map(([month, hires]) => {
      const avgDays = hires.reduce((sum, hire) => {
        const appliedDate = new Date(hire.applicationDate)
        const hiredDate = new Date() // Assuming hired date is current date for simplicity
        const daysDiff = Math.ceil((hiredDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))
        return sum + daysDiff
      }, 0) / hires.length

      return { name: month, days: Math.round(avgDays) }
    })

    // Calculate applicants time series data (last 6 months)
    console.log('Total applications found:', applications.length)
    console.log('Six months ago date:', sixMonthsAgo)

    const monthlyApplicants = applications
      .filter(app => {
        const appDate = new Date(app.applicationDate)
        console.log('Application date:', app.applicationDate, 'Parsed:', appDate, 'Is after six months ago:', appDate >= sixMonthsAgo)
        return appDate >= sixMonthsAgo
      })
      .reduce((acc, app) => {
        const month = new Date(app.applicationDate).toLocaleDateString('en-US', { month: 'short' })
        if (!acc[month]) {
          acc[month] = 0
        }
        acc[month]++
        return acc
      }, {} as Record<string, number>)

    console.log('Monthly applicants:', monthlyApplicants)

    // Generate all months in the last 6 months to ensure we have complete data
    const allMonths = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      allMonths.push(date.toLocaleDateString('en-US', { month: 'short' }))
    }

    const applicantsTimeSeriesData = allMonths.map(month => ({
      name: month,
      applicants: monthlyApplicants[month] || 0
    }))

    console.log('Final applicants time series data:', applicantsTimeSeriesData)

    // If no data in the last 6 months, show all applications regardless of date
    if (applicantsTimeSeriesData.every(item => item.applicants === 0) && applications.length > 0) {
      console.log('No applications in last 6 months, showing all applications')
      const allMonthlyApplicants = applications.reduce((acc, app) => {
        const month = new Date(app.applicationDate).toLocaleDateString('en-US', { month: 'short' })
        if (!acc[month]) {
          acc[month] = 0
        }
        acc[month]++
        return acc
      }, {} as Record<string, number>)

      // Get all months that have applications
      const monthsWithApplications = Object.keys(allMonthlyApplicants).sort()

      // If we have applications, use them instead
      if (monthsWithApplications.length > 0) {
        const allMonthsData = monthsWithApplications.map(month => ({
          name: month,
          applicants: allMonthlyApplicants[month]
        }))

        console.log('Using all applications data:', allMonthsData)
        // Replace the time series data with all applications
        applicantsTimeSeriesData.splice(0, applicantsTimeSeriesData.length, ...allMonthsData)
      }
    }

    // Calculate acceptance rate
    const acceptedOffers = offers.filter(offer => offer.status === 'accepted').length
    const rejectedOffers = offers.filter(offer => offer.status === 'rejected').length
    const totalOffers = acceptedOffers + rejectedOffers

    const acceptanceRateData = [
      { name: 'Accepted', value: acceptedOffers },
      { name: 'Rejected', value: rejectedOffers }
    ]

    // Calculate key metrics
    const totalApplications = applications.length
    const activeJobs = jobPostings.filter(job => job.status === 'published').length
    const totalHires = applications.filter(app => app.pipelineStatus === 'hired').length

    // Calculate average time to hire
    const hiredApplications = applications.filter(app => app.pipelineStatus === 'hired')
    const averageTimeToHire = hiredApplications.length > 0
      ? hiredApplications.reduce((sum, app) => {
          const appliedDate = new Date(app.applicationDate)
          const hiredDate = new Date() // Assuming hired date is current date
          const daysDiff = Math.ceil((hiredDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))
          return sum + daysDiff
        }, 0) / hiredApplications.length
      : 0

    return {
      funnelData,
      timeToHireData,
      applicantsTimeSeriesData,
      acceptanceRateData,
      totalApplications,
      activeJobs,
      totalHires,
      averageTimeToHire: Math.round(averageTimeToHire)
    }
  } catch (error) {
    console.error('Error fetching recruitment analytics:', error)
    // Return default data structure in case of error
    return {
      funnelData: [
        { name: 'Applied', value: 0 },
        { name: 'Reviewed', value: 0 },
        { name: 'Interview', value: 0 },
        { name: 'Offer', value: 0 },
        { name: 'Hired', value: 0 }
      ],
      timeToHireData: [],
      applicantsTimeSeriesData: [],
      acceptanceRateData: [
        { name: 'Accepted', value: 0 },
        { name: 'Rejected', value: 0 }
      ],
      totalApplications: 0,
      activeJobs: 0,
      totalHires: 0,
      averageTimeToHire: 0
    }
  }
}

export async function getCompanyMetrics(companyId: string) {
  try {
    const analytics = await getRecruitmentAnalytics(companyId)

    return {
      totalApplications: analytics.totalApplications,
      activeJobs: analytics.activeJobs,
      totalHires: analytics.totalHires,
      averageTimeToHire: analytics.averageTimeToHire
    }
  } catch (error) {
    console.error('Error fetching company metrics:', error)
    return {
      totalApplications: 0,
      activeJobs: 0,
      totalHires: 0,
      averageTimeToHire: 0
    }
  }
}
