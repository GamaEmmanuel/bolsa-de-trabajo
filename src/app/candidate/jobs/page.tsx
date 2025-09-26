'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { JobPosting } from '../../../types'
import { db } from '../../../lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import Link from 'next/link'

// Extend the JobPosting interface for additional fields
declare module '../../../types' {
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

const JobsPage = () => {
	const [jobs, setJobs] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
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
			<div className="flex items-center justify-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p className="ml-2 text-gray-600">Loading jobs...</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Find Your Next Job</h1>
					<p className="text-gray-600 mt-1">
						{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<label className="text-sm font-medium text-gray-700">Sort by:</label>
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as 'date' | 'salary' | 'relevance')}
						className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="date">Date Posted</option>
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

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Filters Sidebar */}
				<div className="lg:col-span-1">
					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg font-semibold text-gray-900">Filters</h2>
							<button
								onClick={clearFilters}
								className="text-sm text-blue-600 hover:text-blue-800"
							>
								Clear All
							</button>
						</div>

						<div className="space-y-4">
							{/* Keyword Search */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Keywords
								</label>
								<input
									type="text"
									placeholder="Job title, company, skills..."
									value={filters.keyword}
									onChange={(e) => handleFilterChange('keyword', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							{/* Location */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Location
								</label>
								<input
									type="text"
									placeholder="City, state, country..."
									value={filters.location}
									onChange={(e) => handleFilterChange('location', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							{/* Remote Work */}
							<div className="flex items-center">
								<input
									type="checkbox"
									id="remote"
									checked={filters.remote}
									onChange={(e) => handleFilterChange('remote', e.target.checked)}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<label htmlFor="remote" className="ml-2 text-sm text-gray-700">
									Remote only
								</label>
							</div>

							{/* Job Type */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Job Type
								</label>
								<select
									value={filters.jobType}
									onChange={(e) => handleFilterChange('jobType', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="">All Types</option>
									<option value="full-time">Full-time</option>
									<option value="part-time">Part-time</option>
									<option value="contract">Contract</option>
									<option value="internship">Internship</option>
								</select>
							</div>

							{/* Salary Range */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Salary Range (MXN)
								</label>
								<div className="grid grid-cols-2 gap-2">
									<input
										type="number"
										placeholder="Min"
										value={filters.salaryMin}
										onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
										className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
									<input
										type="number"
										placeholder="Max"
										value={filters.salaryMax}
										onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
										className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
							<div className="text-gray-400 text-6xl mb-4">🔍</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
							<p className="text-gray-500">Try adjusting your filters to see more results.</p>
						</div>
					) : (
						<div className="space-y-4">
							{filteredJobs.map(job => (
								<Link
									key={job.jobId}
									href={`/jobs/${job.jobId}`}
									className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
								>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
												{job.jobTitle}
											</h3>
											<p className="text-gray-600 font-medium mt-1">
												{job.companyName || 'Company Name'}
											</p>
											<p className="text-gray-500 text-sm mt-1">
												{job.location || 'Location not specified'}
											</p>
											<div className="flex items-center gap-2 mt-2">
												{job.jobType && (
													<span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
														{job.jobType}
													</span>
												)}
												{job.salaryMin && job.salaryMax && !job.isSalaryHidden && (
													<span className="text-sm text-green-600 font-medium">
														${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} MXN
													</span>
												)}
											</div>
										</div>
										<div className="ml-4 flex flex-col items-end">
											{job.postedDate && (
												<p className="text-xs text-gray-500">
													Posted {new Date(job.postedDate).toLocaleDateString()}
												</p>
											)}
											<div className="mt-2 text-blue-600 text-sm font-medium">
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
	)
}

export default JobsPage
