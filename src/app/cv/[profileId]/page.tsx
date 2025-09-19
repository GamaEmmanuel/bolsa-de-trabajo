'use client'

import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CandidateProfile } from '../../../../types'

// Mock function to simulate sending an email notification
const sendCvViewedNotification = (candidateEmail: string) => {
	console.log(`
    ============================================
    Sending Email Notification...
    To: ${candidateEmail}
    Subject: Good News! Your CV has been viewed!

    Hi there,

    A recruiter from [Company Name] has just viewed your CV.
    This is a great sign! Keep an eye on your inbox for potential interview requests.

    Best regards,
    The HR Portal Team
    ============================================
  `)
}

// Mock data for a candidate profile
const mockProfile: CandidateProfile = {
	profileId: 'prof-1',
	userId: 'user-1',
	candidateEmail: 'candidate@example.com',
	fullName: 'Elena Rodriguez',
	headline: 'Senior Frontend Developer | React, TypeScript',
	skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
	location: 'Mexico City, MX',
	workExperience: [
		{
			title: 'Frontend Developer',
			company: 'Tech Solutions Inc.',
			years: '2020 - Present',
		},
	],
	education: [{ school: 'National University', degree: 'Computer Science' }],
}

const PublicCvPage = () => {
	const { profileId } = useParams()

	useEffect(() => {
		// This simulates a recruiter viewing the CV, which triggers the notification.
		// In a real app, you would have logic to ensure this only triggers once
		// and only when a recruiter (not the candidate themselves) views the page.
		if (mockProfile.candidateEmail) {
			sendCvViewedNotification(mockProfile.candidateEmail)
		}
	}, [profileId])

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
				<h1 className="text-3xl font-bold">{mockProfile.fullName}</h1>
				<p className="text-xl text-gray-600 mt-1">{mockProfile.headline}</p>
				<p className="text-md text-gray-500">{mockProfile.location}</p>

				<hr className="my-6" />

				<div>
					<h2 className="text-2xl font-semibold mb-4">Skills</h2>
					<div className="flex flex-wrap gap-2">
						{mockProfile.skills.map(skill => (
							<span
								key={skill}
								className="px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full"
							>
								{skill}
							</span>
						))}
					</div>
				</div>

				{/* Other CV sections would go here */}
			</div>
		</div>
	)
}

export default PublicCvPage

// Extend the CandidateProfile interface for the mock data
declare module '../../../../types' {
	interface CandidateProfile {
		candidateEmail?: string
		fullName?: string
		headline?: string
		location?: string
	}
}