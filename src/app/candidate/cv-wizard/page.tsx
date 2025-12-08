'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

// Mock AI function - in a real app, this would be an API call
const getAiSuggestions = async (jobTitle: string) => {
	console.log(`Fetching suggestions for ${jobTitle}...`)
	// Simulate network delay
	await new Promise(resolve => setTimeout(resolve, 1000))

	// Mock suggestions based on job title
	if (jobTitle.toLowerCase().includes('developer')) {
		return {
			responsibilities: [
				'Developing and maintaining web applications.',
				'Collaborating with cross-functional teams.',
				'Writing clean, high-quality code.',
			],
			skills: ['React', 'Node.js', 'TypeScript', 'SQL'],
		}
	} else if (jobTitle.toLowerCase().includes('designer')) {
		return {
			responsibilities: [
				'Creating user-centered design solutions.',
				'Developing wireframes, mockups, and prototypes.',
				'Collaborating with product managers and engineers.',
			],
			skills: ['Figma', 'Sketch', 'Adobe XD', 'UI/UX Design'],
		}
	} else {
		return {
			responsibilities: [
				'Enter a job title to get AI-powered suggestions.',
				'Example: "Software Developer" or "UX Designer"',
			],
			skills: ['Teamwork', 'Communication'],
		}
	}
}

const CvWizardPage = () => {
	const [jobTitle, setJobTitle] = useState('')
	const [responsibilities, setResponsibilities] = useState<string[]>([])
	const [skills, setSkills] = useState<string[]>([])
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleGenerateSuggestions = async () => {
		if (!jobTitle) return
		setLoading(true)
		const suggestions = await getAiSuggestions(jobTitle)
		setResponsibilities(suggestions.responsibilities)
		setSkills(suggestions.skills)
		setLoading(false)
	}

	const handleSaveChanges = () => {
		// Here you would save the CV data to your database
		console.log('Saving CV data:', { jobTitle, responsibilities, skills })
		router.push('/candidate/dashboard')
	}

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
				<h1 className="text-3xl font-bold mb-6">AI-Powered CV Wizard</h1>

				<div className="mb-6">
					<label
						htmlFor="jobTitle"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Enter a Job Title
					</label>
					<div className="flex">
						<input
							id="jobTitle"
							type="text"
							value={jobTitle}
							onChange={e => setJobTitle(e.target.value)}
							placeholder="e.g., Senior Software Developer"
							className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						/>
						<button
							onClick={handleGenerateSuggestions}
							disabled={loading}
							className="px-4 py-2 text-white bg-pink-600 rounded-r-md hover:bg-pink-700 disabled:bg-gray-400"
						>
							{loading ? 'Generating...' : 'Get Suggestions'}
						</button>
					</div>
				</div>

				<div className="mb-6">
					<h2 className="text-xl font-semibold mb-4">
						Key Responsibilities
					</h2>
					<textarea
						value={responsibilities.join('\n')}
						onChange={e => setResponsibilities(e.target.value.split('\n'))}
						rows={6}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
						placeholder="AI-generated responsibilities will appear here."
					/>
				</div>

				<div className="mb-6">
					<h2 className="text-xl font-semibold mb-4">Skills</h2>
					<textarea
						value={skills.join(', ')}
						onChange={e => setSkills(e.target.value.split(', '))}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
						placeholder="AI-generated skills will appear here."
					/>
				</div>

				<div className="flex justify-end">
					<button
						onClick={handleSaveChanges}
						className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
					>
						Save CV
					</button>
				</div>
			</div>
		</div>
	)
}

export default CvWizardPage