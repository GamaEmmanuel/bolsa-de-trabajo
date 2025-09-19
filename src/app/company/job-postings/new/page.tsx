'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth } from '../../../../lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { JobTier, JobStatus } from '../../../../../types'

const NewJobPostingPage = () => {
	const [jobTitle, setJobTitle] = useState('')
	const [jobDescription, setJobDescription] = useState('')
	const [selectedTier, setSelectedTier] = useState<JobTier>('clasica')
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!auth.currentUser) {
			// Handle user not logged in
			alert('You must be logged in to create a job posting.')
			return
		}
		setLoading(true)

		try {
			// For this implementation, we'll use the user's UID as the companyId
			// In a real app, companyId would come from the user's company profile
			const companyId = auth.currentUser.uid

			await addDoc(collection(db, 'jobPostings'), {
				jobTitle,
				jobDescription,
				tier: selectedTier,
				status: 'pending_approval' as JobStatus,
				createdByUserId: auth.currentUser.uid,
				companyId: companyId,
				postedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
			})

			// Redirect to the checkout page after successful save
			router.push(`/company/checkout?tier=${selectedTier}`)
		} catch (error) {
			console.error('Error creating job posting:', error)
			alert('Failed to create job posting. Please try again.')
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
				<h1 className="text-3xl font-bold mb-6">Create New Job Posting</h1>

				<form onSubmit={handleSubmit}>
					{/* Job Details */}
					<div className="mb-6">
						<label
							htmlFor="jobTitle"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Job Title
						</label>
						<input
							id="jobTitle"
							type="text"
							value={jobTitle}
							onChange={e => setJobTitle(e.target.value)}
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
					</div>
					<div className="mb-8">
						<label
							htmlFor="jobDescription"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Job Description
						</label>
						<textarea
							id="jobDescription"
							value={jobDescription}
							onChange={e => setJobDescription(e.target.value)}
							required
							rows={8}
							className="w-full px-3 py-2 border border-gray-300 rounded-md"
						/>
					</div>

					{/* Tier Selection */}
					<div className="mb-8">
						<h2 className="text-xl font-semibold mb-4">
							Choose a Posting Tier
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{/* Tiers... */}
							<div
								onClick={() => setSelectedTier('clasica')}
								className={`p-6 border rounded-lg cursor-pointer text-center ${
									selectedTier === 'clasica'
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-300'
								}`}
							>
								<h3 className="text-lg font-bold">Clásica</h3>
								<p className="text-gray-600">Basic visibility</p>
							</div>
							<div
								onClick={() => setSelectedTier('destacada')}
								className={`p-6 border rounded-lg cursor-pointer text-center ${
									selectedTier === 'destacada'
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-300'
								}`}
							>
								<h3 className="text-lg font-bold">Destacada</h3>
								<p className="text-gray-600">Higher search placement</p>
							</div>
							<div
								onClick={() => setSelectedTier('premium')}
								className={`p-6 border rounded-lg cursor-pointer text-center ${
									selectedTier === 'premium'
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-300'
								}`}
							>
								<h3 className="text-lg font-bold">Premium</h3>
								<p className="text-gray-600">Top placement & AI features</p>
							</div>
						</div>
					</div>

					{/* Submission */}
					<div className="flex justify-end">
						<button
							type="submit"
							disabled={loading}
							className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
						>
							{loading ? 'Saving...' : 'Proceed to Payment'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default NewJobPostingPage