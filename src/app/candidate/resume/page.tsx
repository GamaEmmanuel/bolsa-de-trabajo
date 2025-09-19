'use client'

import React, { useState, useEffect } from 'react'
import { db, auth } from '../../../lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

interface CandidateProfile {
	userId: string
	firstName: string
	lastName: string
	email: string
	phone?: string
	location?: string
	summary?: string
	experience: WorkExperience[]
	education: Education[]
	skills: string[]
	languages?: Record<string, string>
	desiredSalary?: number
	availability?: string
}

interface WorkExperience {
	id: string
	company: string
	position: string
	startDate: string
	endDate?: string
	current: boolean
	description: string
	achievements: string[]
}

interface Education {
	id: string
	institution: string
	degree: string
	field: string
	startDate: string
	endDate?: string
	current: boolean
	gpa?: string
}

const ResumePage = () => {
	const [profile, setProfile] = useState<CandidateProfile>({
		userId: '',
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		location: '',
		summary: '',
		experience: [],
		education: [],
		skills: [],
		languages: {},
		desiredSalary: undefined,
		availability: '',
	})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [user, setUser] = useState(auth.currentUser)

	// Fetch user profile
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser)
			if (currentUser) {
				try {
					const profileRef = doc(db, 'candidateProfiles', currentUser.uid)
					const profileDoc = await getDoc(profileRef)

					if (profileDoc.exists()) {
						const profileData = profileDoc.data() as CandidateProfile
						setProfile(profileData)
					} else {
						// Initialize with user data
						setProfile(prev => ({
							...prev,
							userId: currentUser.uid,
							email: currentUser.email || '',
						}))
					}
				} catch (error) {
					console.error('Error fetching profile:', error)
					setError('Failed to load profile')
				} finally {
					setLoading(false)
				}
			} else {
				setLoading(false)
			}
		})

		return () => unsubscribeAuth()
	}, [])

	const handleInputChange = (field: keyof CandidateProfile, value: any) => {
		setProfile(prev => ({ ...prev, [field]: value }))
	}

	const addExperience = () => {
		const newExperience: WorkExperience = {
			id: Date.now().toString(),
			company: '',
			position: '',
			startDate: '',
			endDate: '',
			current: false,
			description: '',
			achievements: [],
		}
		setProfile(prev => ({
			...prev,
			experience: [...prev.experience, newExperience]
		}))
	}

	const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
		setProfile(prev => ({
			...prev,
			experience: prev.experience.map(exp =>
				exp.id === id ? { ...exp, [field]: value } : exp
			)
		}))
	}

	const removeExperience = (id: string) => {
		setProfile(prev => ({
			...prev,
			experience: prev.experience.filter(exp => exp.id !== id)
		}))
	}

	const addEducation = () => {
		const newEducation: Education = {
			id: Date.now().toString(),
			institution: '',
			degree: '',
			field: '',
			startDate: '',
			endDate: '',
			current: false,
			gpa: '',
		}
		setProfile(prev => ({
			...prev,
			education: [...prev.education, newEducation]
		}))
	}

	const updateEducation = (id: string, field: keyof Education, value: any) => {
		setProfile(prev => ({
			...prev,
			education: prev.education.map(edu =>
				edu.id === id ? { ...edu, [field]: value } : edu
			)
		}))
	}

	const removeEducation = (id: string) => {
		setProfile(prev => ({
			...prev,
			education: prev.education.filter(edu => edu.id !== id)
		}))
	}

	const addSkill = () => {
		const skill = prompt('Enter a skill:')
		if (skill && skill.trim()) {
			setProfile(prev => ({
				...prev,
				skills: [...prev.skills, skill.trim()]
			}))
		}
	}

	const removeSkill = (index: number) => {
		setProfile(prev => ({
			...prev,
			skills: prev.skills.filter((_, i) => i !== index)
		}))
	}

	const handleSave = async () => {
		if (!user) return

		setSaving(true)
		setError(null)
		setSuccess(false)

		try {
			const profileRef = doc(db, 'candidateProfiles', user.uid)
			const profileData = { ...profile, userId: user.uid }
			await setDoc(profileRef, profileData, { merge: true })
			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
		} catch (error) {
			console.error('Error saving profile:', error)
			setError('Failed to save profile')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p className="ml-2 text-gray-600">Loading profile...</p>
			</div>
		)
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">My Resume</h1>
					<p className="text-gray-600 mt-1">Build and manage your professional profile</p>
				</div>
				<button
					onClick={handleSave}
					disabled={saving}
					className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
				>
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>

			{/* Success/Error Messages */}
			{success && (
				<div className="p-4 bg-green-50 border border-green-200 rounded-md">
					<p className="text-green-600">Profile saved successfully!</p>
				</div>
			)}
			{error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-md">
					<p className="text-red-600">{error}</p>
				</div>
			)}

			{/* Basic Information */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
						<input
							type="text"
							value={profile.firstName}
							onChange={(e) => handleInputChange('firstName', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
						<input
							type="text"
							value={profile.lastName}
							onChange={(e) => handleInputChange('lastName', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
						<input
							type="email"
							value={profile.email}
							disabled
							className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
						<input
							type="tel"
							value={profile.phone || ''}
							onChange={(e) => handleInputChange('phone', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
						<input
							type="text"
							value={profile.location || ''}
							onChange={(e) => handleInputChange('location', e.target.value)}
							placeholder="City, State, Country"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Desired Salary (MXN)</label>
						<input
							type="number"
							value={profile.desiredSalary || ''}
							onChange={(e) => handleInputChange('desiredSalary', e.target.value ? parseInt(e.target.value) : undefined)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>
				<div className="mt-4">
					<label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
					<textarea
						value={profile.summary || ''}
						onChange={(e) => handleInputChange('summary', e.target.value)}
						rows={4}
						placeholder="Brief summary of your professional background and career goals..."
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
			</div>

			{/* Work Experience */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
					<button
						onClick={addExperience}
						className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Add Experience
					</button>
				</div>
				<div className="space-y-4">
					{profile.experience.map((exp) => (
						<div key={exp.id} className="border border-gray-200 rounded-lg p-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
									<input
										type="text"
										value={exp.company}
										onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
									<input
										type="text"
										value={exp.position}
										onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
									<input
										type="date"
										value={exp.startDate}
										onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
									<input
										type="date"
										value={exp.endDate || ''}
										onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
										disabled={exp.current}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
									/>
								</div>
							</div>
							<div className="mt-4 flex items-center">
								<input
									type="checkbox"
									id={`current-${exp.id}`}
									checked={exp.current}
									onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<label htmlFor={`current-${exp.id}`} className="ml-2 text-sm text-gray-700">
									I currently work here
								</label>
							</div>
							<div className="mt-4">
								<label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
								<textarea
									value={exp.description}
									onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
									rows={3}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
							<div className="mt-4 flex justify-end">
								<button
									onClick={() => removeExperience(exp.id)}
									className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
								>
									Remove
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Education */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-900">Education</h2>
					<button
						onClick={addEducation}
						className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Add Education
					</button>
				</div>
				<div className="space-y-4">
					{profile.education.map((edu) => (
						<div key={edu.id} className="border border-gray-200 rounded-lg p-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
									<input
										type="text"
										value={edu.institution}
										onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
									<input
										type="text"
										value={edu.degree}
										onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
									<input
										type="text"
										value={edu.field}
										onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">GPA (Optional)</label>
									<input
										type="text"
										value={edu.gpa || ''}
										onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
									<input
										type="date"
										value={edu.startDate}
										onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
									<input
										type="date"
										value={edu.endDate || ''}
										onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
										disabled={edu.current}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
									/>
								</div>
							</div>
							<div className="mt-4 flex items-center">
								<input
									type="checkbox"
									id={`current-edu-${edu.id}`}
									checked={edu.current}
									onChange={(e) => updateEducation(edu.id, 'current', e.target.checked)}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<label htmlFor={`current-edu-${edu.id}`} className="ml-2 text-sm text-gray-700">
									Currently studying
								</label>
							</div>
							<div className="mt-4 flex justify-end">
								<button
									onClick={() => removeEducation(edu.id)}
									className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
								>
									Remove
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Skills */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold text-gray-900">Skills</h2>
					<button
						onClick={addSkill}
						className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Add Skill
					</button>
				</div>
				<div className="flex flex-wrap gap-2">
					{profile.skills.map((skill, index) => (
						<span
							key={index}
							className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
						>
							{skill}
							<button
								onClick={() => removeSkill(index)}
								className="ml-2 text-blue-600 hover:text-blue-800"
							>
								×
							</button>
						</span>
					))}
				</div>
			</div>
		</div>
	)
}

export default ResumePage
