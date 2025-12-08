'use client'

import React, { useState } from 'react'
import Link from 'next/link'

// Mock AI function for generating job descriptions
const generateDescription = async (jobTitle: string, skills: string) => {
	console.log(`Generating description for ${jobTitle} with skills: ${skills}...`)
	await new Promise(resolve => setTimeout(resolve, 1000))

	return `**Job Title:** ${jobTitle}\n\n**About the Role:**\nWe are looking for a talented ${jobTitle} to join our dynamic team. The ideal candidate will have a strong background in ${skills} and a passion for creating exceptional user experiences.\n\n**Responsibilities:**\n- Collaborate with cross-functional teams to define, design, and ship new features.\n- Ensure the technical feasibility of UI/UX designs.\n- Optimize applications for maximum speed and scalability.\n\n**Qualifications:**\n- Proven experience as a ${jobTitle}.\n- Proficiency in the following skills: ${skills}.\n- Excellent communication and teamwork skills.`
}

const AiGeneratorPage = () => {
	const [jobTitle, setJobTitle] = useState('')
	const [skills, setSkills] = useState('')
	const [description, setDescription] = useState('')
	const [loading, setLoading] = useState(false)

	const handleGenerate = async () => {
		if (!jobTitle || !skills) return
		setLoading(true)
		const generatedDesc = await generateDescription(jobTitle, skills)
		setDescription(generatedDesc)
		setLoading(false)
	}

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-3xl font-bold">
						AI Job Description Generator
					</h1>
					<Link
						href="/company/dashboard"
						className="text-blue-600 hover:underline"
					>
						&larr; Back to Dashboard
					</Link>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
					<div>
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
							placeholder="e.g., Frontend Developer"
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
						/>
					</div>
					<div>
						<label
							htmlFor="skills"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Key Skills (comma-separated)
						</label>
						<input
							id="skills"
							type="text"
							value={skills}
							onChange={e => setSkills(e.target.value)}
							placeholder="e.g., React, TypeScript, Node.js"
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
						/>
					</div>
				</div>

				<div className="flex justify-center mb-6">
					<button
						onClick={handleGenerate}
						disabled={loading}
						className="px-6 py-2 text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:bg-gray-400"
					>
						{loading ? 'Generating...' : 'Generate Description'}
					</button>
				</div>

				<div>
					<label
						htmlFor="description"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Generated Description
					</label>
					<textarea
						id="description"
						value={description}
						onChange={e => setDescription(e.target.value)}
						rows={12}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
						placeholder="The AI-generated job description will appear here."
					/>
				</div>
			</div>
		</div>
	)
}

export default AiGeneratorPage