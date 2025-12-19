'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { JobPosting } from '../../types'
import { db } from '../../lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import Header from '../../components/Header'
import Link from 'next/link'

// Extend the JobPosting interface for additional fields
declare module '../../types' {
	interface JobPosting {
		companyName?: string
		location?: string
	}
}

interface JobFilters {
	keyword: string
	location: string
	jobType: string
	salaryMin: string
	salaryMax: string
	experience: string
	remote: boolean
}

const JobSearchPageClient = () => {
	const [jobs, setJobs] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showFilters, setShowFilters] = useState(false)
	const [filters, setFilters] = useState<JobFilters>({
		keyword: '',
		location: '',
		jobType: '',
		salaryMin: '',
		salaryMax: '',
		experience: '',
		remote: false,
	})
	const [sortBy, setSortBy] = useState<'date' | 'salary' | 'relevance'>('date')

	// Fetch jobs from database
	useEffect(() => {
		const q = query(
			collection(db, 'jobPostings'),
			where('status', '==', 'published'),
			orderBy('postedDate', 'desc')
		)

		const unsubscribe = onSnapshot(q,
			(querySnapshot) => {
				const jobsData: JobPosting[] = []
				querySnapshot.forEach(doc => {
					jobsData.push({ jobId: doc.id, ...doc.data() } as JobPosting)
				})
				console.log('Fetched jobs:', jobsData.length, 'jobs found')
				console.log('Jobs data:', jobsData)
				setJobs(jobsData)
				setLoading(false)
			},
			(error) => {
				console.error('Error fetching job postings:', error)
				setError('Failed to load job postings. Please try again.')
				setLoading(false)
			}
		)

		return () => unsubscribe()
	}, [])

	// Filter and sort jobs
	const filteredJobs = useMemo(() => {
		const filtered = jobs.filter(job => {
			// Keyword filter
			if (filters.keyword) {
				const keyword = filters.keyword.toLowerCase()
				const matchesTitle = job.jobTitle?.toLowerCase().includes(keyword)
				const matchesDescription = job.jobDescription?.toLowerCase().includes(keyword)
				const matchesCompany = job.companyName?.toLowerCase().includes(keyword)
				if (!matchesTitle && !matchesDescription && !matchesCompany) return false
			}

			// Location filter
			if (filters.location) {
				const location = filters.location.toLowerCase()
				const jobLocation = job.location?.toLowerCase() || ''
				if (!jobLocation.includes(location) && !jobLocation.includes('remote')) return false
			}

			// Remote filter
			if (filters.remote) {
				const jobLocation = job.location?.toLowerCase() || ''
				if (!jobLocation.includes('remote')) return false
			}

			// Job type filter
			if (filters.jobType && job.jobType !== filters.jobType) return false

			// Salary filter
			if (filters.salaryMin && job.salaryMin) {
				if (job.salaryMin < parseInt(filters.salaryMin)) return false
			}
			if (filters.salaryMax && job.salaryMax) {
				if (job.salaryMax > parseInt(filters.salaryMax)) return false
			}

			return true
		})

		// Sort jobs
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'salary':
					return (b.salaryMin || 0) - (a.salaryMin || 0)
				case 'relevance':
					// Simple relevance based on keyword matches
					if (filters.keyword) {
						const keyword = filters.keyword.toLowerCase()
						const aMatches = (a.jobTitle?.toLowerCase().includes(keyword) ? 2 : 0) +
							(a.jobDescription?.toLowerCase().includes(keyword) ? 1 : 0)
						const bMatches = (b.jobTitle?.toLowerCase().includes(keyword) ? 2 : 0) +
							(b.jobDescription?.toLowerCase().includes(keyword) ? 1 : 0)
						return bMatches - aMatches
					}
					return 0
				case 'date':
				default:
					return new Date(b.postedDate || '').getTime() - new Date(a.postedDate || '').getTime()
			}
		})

		return filtered
	}, [jobs, filters, sortBy])

	const handleFilterChange = (key: keyof JobFilters, value: string | boolean) => {
		setFilters(prev => ({ ...prev, [key]: value }))
	}

	const clearFilters = () => {
		setFilters({
			keyword: '',
			location: '',
			jobType: '',
			salaryMin: '',
			salaryMax: '',
			experience: '',
			remote: false,
		})
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-secondary">
				<Header />
				<div className="flex items-center justify-center py-12">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					<p className="ml-2 text-muted-foreground">Loading job postings...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-secondary">
			<Header />
			<div className="max-w-7xl mx-auto py-6 md:py-12 px-4 sm:px-6 lg:px-8">
				<div className="space-y-4 md:space-y-6">
					{/* Header */}
					<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
						<div className="min-w-0 flex-1">
							<h1 className="text-2xl md:text-3xl font-bold text-foreground">Find Your Next Opportunity</h1>
							<p className="text-sm md:text-base text-muted-foreground mt-1">
								{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
							</p>
						</div>
						<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
							<label className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">Sort by:</label>
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value as 'date' | 'salary' | 'relevance')}
								className="flex-1 sm:flex-initial px-3 py-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-input"
							>
								<option value="date">Publication Date</option>
								<option value="salary">Salary</option>
								<option value="relevance">Relevance</option>
							</select>
						</div>
					</div>

					{error && (
						<div className="p-4 bg-red-50 border border-red-200 rounded-md">
							<p className="text-red-600">{error}</p>
						</div>
					)}

					{/* Mobile Filter Toggle */}
					<button
						onClick={() => setShowFilters(!showFilters)}
						className="lg:hidden w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
						</svg>
						{showFilters ? 'Hide Filters' : 'Show Filters'}
					</button>

					<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
						{/* Filters Sidebar */}
						<div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
							<div className="bg-card p-4 md:p-6 rounded-lg shadow-sm border border-border">
								<div className="flex justify-between items-center mb-4">
									<h2 className="text-base md:text-lg font-semibold text-foreground">Filters</h2>
									<button
										onClick={clearFilters}
										className="text-xs md:text-sm text-primary hover:text-primary/80"
									>
										Clear All
									</button>
								</div>

								<div className="space-y-3 md:space-y-4">
									{/* Keyword Search */}
									<div>
										<label className="block text-xs md:text-sm font-medium text-foreground mb-2">
											Keywords
										</label>
										<input
											type="text"
											placeholder="Job title, company, skills..."
											value={filters.keyword}
											onChange={(e) => handleFilterChange('keyword', e.target.value)}
											className="w-full px-3 py-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-input"
										/>
									</div>

									{/* Location */}
									<div>
										<label className="block text-xs md:text-sm font-medium text-foreground mb-2">
											Location
										</label>
										<input
											type="text"
											placeholder="City, state, country..."
											value={filters.location}
											onChange={(e) => handleFilterChange('location', e.target.value)}
											className="w-full px-3 py-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-input"
										/>
									</div>

									{/* Remote Work */}
									<div className="flex items-center">
										<input
											type="checkbox"
											id="remote"
											checked={filters.remote}
											onChange={(e) => handleFilterChange('remote', e.target.checked)}
											className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
										/>
										<label htmlFor="remote" className="ml-2 text-xs md:text-sm text-foreground">
											Remote only
										</label>
									</div>

									{/* Job Type */}
									<div>
										<label className="block text-xs md:text-sm font-medium text-foreground mb-2">
											Job Type
										</label>
										<select
											value={filters.jobType}
											onChange={(e) => handleFilterChange('jobType', e.target.value)}
											className="w-full px-3 py-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-input"
										>
											<option value="">All Types</option>
											<option value="full-time">Full Time</option>
											<option value="part-time">Part Time</option>
											<option value="contract">Contract</option>
											<option value="internship">Internship</option>
										</select>
									</div>

									{/* Salary Range */}
									<div>
										<label className="block text-xs md:text-sm font-medium text-foreground mb-2">
											Salary Range (MXN)
										</label>
										<div className="grid grid-cols-2 gap-2">
											<input
												type="number"
												placeholder="Min"
												value={filters.salaryMin}
												onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
												className="px-3 py-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-input"
											/>
											<input
												type="number"
												placeholder="Max"
												value={filters.salaryMax}
												onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
												className="px-3 py-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-input"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Job Listings */}
						<div className="lg:col-span-3">
							{filteredJobs.length === 0 ? (
								<div className="text-center py-12">
									<div className="text-muted-foreground text-4xl md:text-6xl mb-4">🔍</div>
									<h3 className="text-base md:text-lg font-medium text-foreground mb-2">No jobs found</h3>
									<p className="text-sm md:text-base text-muted-foreground">Try adjusting your filters to see more results.</p>
								</div>
							) : (
								<div className="space-y-3 md:space-y-4">
									{filteredJobs.map(job => (
										<Link
											key={job.jobId}
											href={`/jobs/${job.jobId}`}
											className="block bg-card p-4 md:p-6 rounded-lg shadow-sm border border-border hover:shadow-md hover:border-primary transition-all duration-200 cursor-pointer"
										>
											<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
												<div className="flex-1 min-w-0">
													<h3 className="text-base md:text-xl font-semibold text-foreground hover:text-primary transition-colors truncate">
														{job.jobTitle}
													</h3>
													<p className="text-sm md:text-base text-muted-foreground font-medium mt-1 truncate">
														{job.companyName || 'Company Name'}
													</p>
													<p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
														{job.location || 'Location not specified'}
													</p>
													<div className="flex flex-wrap items-center gap-2 mt-2">
														{job.jobType && (
															<span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
																{job.jobType}
															</span>
														)}
														{job.salaryMin && job.salaryMax && !job.isSalaryHidden && (
															<span className="text-xs md:text-sm text-green-600 font-medium">
																${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} MXN
															</span>
														)}
													</div>
												</div>
												<div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
													{job.postedDate && (
														<p className="text-xs text-muted-foreground whitespace-nowrap">
															Posted {new Date(job.postedDate).toLocaleDateString()}
														</p>
													)}
													<div className="text-primary text-xs md:text-sm font-medium whitespace-nowrap">
														View Details →
													</div>
												</div>
											</div>
										</Link>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default JobSearchPageClient

