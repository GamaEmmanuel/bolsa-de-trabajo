'use client'

import React, { useState, useEffect } from 'react'
import { JobPosting } from '../../types'
import { db } from '../../lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import Header from '../../components/Header'

// Extend the JobPosting interface for additional fields
declare module '../../types' {
	interface JobPosting {
		companyName?: string
		location?: string
	}
}

const JobSearchPage = () => {
	const [filters, setFilters] = useState({
		keyword: '',
		location: '',
		category: '',
		contractType: '',
		workModality: '',
	})
	const [results, setResults] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Fetch published jobs from database
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
				setResults(jobsData)
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

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		console.log('Searching with advanced filters:', filters)
		// TODO: Implement actual search logic with filters
		// For now, we'll just log the filters
	}

	return (
		<div className="min-h-screen bg-secondary">
			<Header />
			<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
				<div className="text-center">
					<h1 className="text-4xl font-extrabold text-foreground sm:text-5xl">
						Find Your Next Opportunity
					</h1>
					<p className="mt-4 text-xl text-muted-foreground">
						Search through thousands of openings from top companies.
					</p>
				</div>

				{/* Filter Form */}
				<div className="mt-10 bg-card p-6 rounded-lg border border-border">
					<form onSubmit={handleSearch} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<input
								type="text"
								placeholder="Job title or keyword"
								className="lg:col-span-2 w-full px-3 py-2 bg-input border border-border rounded-md"
								onChange={e => setFilters({ ...filters, keyword: e.target.value })}
							/>
							<input
								type="text"
								placeholder="City, state, or remote"
								className="w-full px-3 py-2 bg-input border border-border rounded-md"
								onChange={e => setFilters({ ...filters, location: e.target.value })}
							/>
							<button
								type="submit"
								className="w-full px-6 py-2 text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
							>
								Search
							</button>
						</div>
					</form>
				</div>

				{/* Job Listings */}
				<div className="mt-8 space-y-6">
					{loading && (
						<div className="text-center py-8">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
							<p className="mt-2 text-muted-foreground">Loading job postings...</p>
						</div>
					)}

					{error && (
						<div className="text-center py-8">
							<p className="text-red-500">{error}</p>
						</div>
					)}

					{!loading && !error && results.length === 0 && (
						<div className="text-center py-8">
							<p className="text-muted-foreground">No job postings found.</p>
						</div>
					)}

					{!loading && !error && results.map(job => (
						<a
							key={job.jobId}
							href={`/jobs/${job.jobId}`}
							className="block bg-card p-6 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
						>
							<div className="flex justify-between items-start">
								<div className="flex-1">
									<h2 className="text-xl font-bold text-foreground hover:text-primary transition-colors">{job.jobTitle}</h2>
									<p className="text-muted-foreground font-semibold">{job.companyName || 'Company Name'}</p>
									<p className="text-muted-foreground">{job.location || 'Location not specified'}</p>
									{job.salaryMin && job.salaryMax && !job.isSalaryHidden && (
										<p className="text-sm text-primary font-medium">
											${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} MXN
										</p>
									)}
								</div>
								<div className="ml-4 text-primary text-sm font-medium">
									View Details →
								</div>
							</div>
						</a>
					))}
				</div>
			</div>
		</div>
	)
}

export default JobSearchPage

// Add companyName and location to the JobPosting interface for the purpose of this mock
declare module '../../types' {
	interface JobPosting {
		companyName?: string
		location?: string
	}
}