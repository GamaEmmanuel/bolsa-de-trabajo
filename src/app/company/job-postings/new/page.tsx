'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth } from '../../../../lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { JobTier, JobStatus, JobType, EmploymentType, ExperienceLevel, EducationLevel, JobCategory, JobLevel, CompanySize, Industry, StartDate, UrgencyLevel, ApplicationProcess, InterviewRounds } from '../../../../../types'
import {
	JOB_TYPE_OPTIONS,
	EMPLOYMENT_TYPE_OPTIONS,
	EXPERIENCE_LEVEL_OPTIONS,
	EDUCATION_LEVEL_OPTIONS,
	JOB_CATEGORY_OPTIONS,
	JOB_LEVEL_OPTIONS,
	MEXICAN_CITIES,
	COMPANY_SIZE_OPTIONS,
	INDUSTRY_OPTIONS,
	START_DATE_OPTIONS,
	URGENCY_LEVEL_OPTIONS,
	APPLICATION_PROCESS_OPTIONS,
	INTERVIEW_ROUNDS_OPTIONS,
	BENEFITS_OPTIONS,
	COMPANY_CULTURE_OPTIONS,
	EXTERNAL_JOB_BOARDS
} from '../../../../lib/constants'

const NewJobPostingPage = () => {
	// Basic Information
	const [jobTitle, setJobTitle] = useState('')
	const [jobDescription, setJobDescription] = useState('')

	// Phase 1 Fields
	const [jobType, setJobType] = useState<JobType>('full-time')
	const [employmentType, setEmploymentType] = useState<EmploymentType>('on-site')
	const [salaryMin, setSalaryMin] = useState('25000')
	const [salaryMax, setSalaryMax] = useState('50000')
	const [isSalaryHidden, setIsSalaryHidden] = useState(false)
	const [yearsOfExperience, setYearsOfExperience] = useState<ExperienceLevel>('1-3')
	const [location, setLocation] = useState('')

	// Phase 2 Fields
	const [educationLevel, setEducationLevel] = useState<EducationLevel>('bachelor')
	const [requiredSkills, setRequiredSkills] = useState('')
	const [preferredSkills, setPreferredSkills] = useState('')
	const [jobCategory, setJobCategory] = useState<JobCategory>('engineering')
	const [jobLevel, setJobLevel] = useState<JobLevel>('mid-level')

	// Phase 3 Fields
	const [applicationDeadline, setApplicationDeadline] = useState('')
	const [startDate, setStartDate] = useState<StartDate>('flexible')
	const [companySize, setCompanySize] = useState<CompanySize>('11-50')
	const [industry, setIndustry] = useState<Industry>('technology')
	const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('normal')
	const [applicationProcess, setApplicationProcess] = useState<ApplicationProcess>('resume-only')
	const [interviewRounds, setInterviewRounds] = useState<InterviewRounds>('2')
	const [applicationQuestions, setApplicationQuestions] = useState('')
	const [requiredDocuments, setRequiredDocuments] = useState('')
	const [internalNotes, setInternalNotes] = useState('')
	const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
	const [selectedCulture, setSelectedCulture] = useState<string[]>([])
	const [selectedJobBoards, setSelectedJobBoards] = useState<string[]>([])

	// Tier and Status
	const [selectedTier, setSelectedTier] = useState<JobTier>('clasica')
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!auth.currentUser) {
			alert('You must be logged in to create a job posting.')
			return
		}
		setLoading(true)

		try {
			const companyId = auth.currentUser.uid

			// Prepare job posting data with all new fields
			const jobData = {
				jobTitle,
				jobDescription,
				jobType,
				employmentType,
				yearsOfExperience,
				educationLevel,
				requiredSkills: requiredSkills.split(',').map(skill => skill.trim()).filter(skill => skill),
				preferredSkills: preferredSkills.split(',').map(skill => skill.trim()).filter(skill => skill),
				jobCategory,
				jobLevel,
				location,
				salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
				salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
				isSalaryHidden,
				// Phase 3 Fields
				applicationDeadline: applicationDeadline || undefined,
				startDate,
				companySize,
				industry,
				urgencyLevel,
				applicationProcess,
				interviewRounds,
				applicationQuestions: applicationQuestions.split('\n').filter(q => q.trim()),
				requiredDocuments: requiredDocuments.split(',').map(doc => doc.trim()).filter(doc => doc),
				internalNotes: internalNotes || undefined,
				benefits: selectedBenefits,
				companyCulture: selectedCulture,
				externalJobBoards: selectedJobBoards,
				tier: selectedTier,
				status: 'published' as JobStatus,
				createdByUserId: auth.currentUser.uid,
				companyId: companyId,
				postedDate: new Date().toISOString().split('T')[0],
			}

			await addDoc(collection(db, 'jobPostings'), jobData)

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

				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Basic Information */}
					<div className="bg-gray-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Basic Information</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
									Job Title *
						</label>
						<input
							id="jobTitle"
							type="text"
							value={jobTitle}
							onChange={e => setJobTitle(e.target.value)}
							required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="e.g., Senior Software Engineer"
						/>
					</div>
							<div>
								<label htmlFor="jobCategory" className="block text-sm font-medium text-gray-700 mb-2">
									Job Category *
								</label>
								<select
									id="jobCategory"
									value={jobCategory}
									onChange={e => setJobCategory(e.target.value as JobCategory)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{JOB_CATEGORY_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="mt-6">
							<label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
								Job Description *
						</label>
						<textarea
							id="jobDescription"
							value={jobDescription}
							onChange={e => setJobDescription(e.target.value)}
							required
								rows={6}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Describe the role, responsibilities, and what makes this opportunity special..."
							/>
						</div>
					</div>

					{/* Phase 1: Essential Fields */}
					<div className="bg-blue-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Job Details</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							<div>
								<label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-2">
									Job Type *
								</label>
								<select
									id="jobType"
									value={jobType}
									onChange={e => setJobType(e.target.value as JobType)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{JOB_TYPE_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-2">
									Work Arrangement *
								</label>
								<select
									id="employmentType"
									value={employmentType}
									onChange={e => setEmploymentType(e.target.value as EmploymentType)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{EMPLOYMENT_TYPE_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="jobLevel" className="block text-sm font-medium text-gray-700 mb-2">
									Job Level *
								</label>
								<select
									id="jobLevel"
									value={jobLevel}
									onChange={e => setJobLevel(e.target.value as JobLevel)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{JOB_LEVEL_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
							<div>
								<label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
									Years of Experience *
								</label>
								<select
									id="yearsOfExperience"
									value={yearsOfExperience}
									onChange={e => setYearsOfExperience(e.target.value as ExperienceLevel)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{EXPERIENCE_LEVEL_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
									Location *
								</label>
								<select
									id="location"
									value={location}
									onChange={e => setLocation(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="">Select a city</option>
									<optgroup label="Tier 1 Cities">
										{MEXICAN_CITIES['tier-1'].map(city => (
											<option key={city.value} value={city.value}>
												{city.label}
											</option>
										))}
									</optgroup>
									<optgroup label="Tier 2 Cities">
										{MEXICAN_CITIES['tier-2'].map(city => (
											<option key={city.value} value={city.value}>
												{city.label}
											</option>
										))}
									</optgroup>
									<optgroup label="Tier 3 Cities">
										{MEXICAN_CITIES['tier-3'].map(city => (
											<option key={city.value} value={city.value}>
												{city.label}
											</option>
										))}
									</optgroup>
								</select>
							</div>
						</div>
					</div>

					{/* Salary Information */}
					<div className="bg-green-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Salary Information</h2>
						<div className="space-y-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-4">
									Salary Range (MXN)
								</label>

								{/* Dual Range Slider Container */}
								<div className="relative h-8 flex items-center">
									{/* Background Track */}
									<div className="absolute w-full h-2 bg-gray-200 rounded-lg"></div>

									{/* Active Range */}
									<div
										className="absolute h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg"
										style={{
											left: `${(parseInt(salaryMin || '0') / 200000) * 100}%`,
											width: `${((parseInt(salaryMax || '0') - parseInt(salaryMin || '0')) / 200000) * 100}%`
										}}
									></div>

									{/* Min Slider */}
									<input
										type="range"
										min="0"
										max="200000"
										step="5000"
										value={salaryMin}
										onChange={e => {
											const min = parseInt(e.target.value)
											const max = parseInt(salaryMax || '0')
											if (min <= max) {
												setSalaryMin(e.target.value)
											}
										}}
										className="salary-min-slider absolute w-full h-2 bg-transparent appearance-none cursor-pointer z-10"
										style={{
											background: 'transparent'
										}}
									/>

									{/* Max Slider */}
									<input
										type="range"
										min="0"
										max="200000"
										step="5000"
										value={salaryMax}
										onChange={e => {
											const min = parseInt(salaryMin || '0')
											const max = parseInt(e.target.value)
											if (max >= min) {
												setSalaryMax(e.target.value)
											}
										}}
										className="salary-max-slider absolute w-full h-2 bg-transparent appearance-none cursor-pointer z-20"
										style={{
											background: 'transparent'
										}}
									/>
								</div>

								{/* Salary Range Display */}
								<div className="flex justify-between mt-6">
									<div className="text-center">
										<div className="text-lg font-semibold text-blue-600">
											${parseInt(salaryMin || '0').toLocaleString()}
										</div>
										<div className="text-sm text-gray-500">Minimum</div>
									</div>
									<div className="text-center">
										<div className="text-lg font-semibold text-green-600">
											${parseInt(salaryMax || '0').toLocaleString()}
										</div>
										<div className="text-sm text-gray-500">Maximum</div>
									</div>
								</div>

								{/* Quick Salary Presets */}
								<div className="mt-6">
									<div className="text-sm text-gray-600 mb-3">Quick presets:</div>
									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											onClick={() => {
												setSalaryMin('15000')
												setSalaryMax('25000')
											}}
											className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
										>
											$15k - $25k
										</button>
										<button
											type="button"
											onClick={() => {
												setSalaryMin('25000')
												setSalaryMax('40000')
											}}
											className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
										>
											$25k - $40k
										</button>
										<button
											type="button"
											onClick={() => {
												setSalaryMin('40000')
												setSalaryMax('60000')
											}}
											className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
										>
											$40k - $60k
										</button>
										<button
											type="button"
											onClick={() => {
												setSalaryMin('60000')
												setSalaryMax('100000')
											}}
											className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
										>
											$60k - $100k
										</button>
										<button
											type="button"
											onClick={() => {
												setSalaryMin('100000')
												setSalaryMax('200000')
											}}
											className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
										>
											$100k+
										</button>
									</div>
								</div>
							</div>

							<div className="flex items-center justify-center">
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={isSalaryHidden}
										onChange={e => setIsSalaryHidden(e.target.checked)}
										className="mr-2"
									/>
									<span className="text-sm text-gray-700">Hide salary from public</span>
								</label>
							</div>
						</div>
					</div>

					{/* Phase 2: Additional Requirements */}
					<div className="bg-yellow-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Requirements & Skills</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700 mb-2">
									Education Level *
								</label>
								<select
									id="educationLevel"
									value={educationLevel}
									onChange={e => setEducationLevel(e.target.value as EducationLevel)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{EDUCATION_LEVEL_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="requiredSkills" className="block text-sm font-medium text-gray-700 mb-2">
									Required Skills
								</label>
								<input
									id="requiredSkills"
									type="text"
									value={requiredSkills}
									onChange={e => setRequiredSkills(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="JavaScript, React, Node.js (comma separated)"
								/>
							</div>
						</div>
						<div className="mt-6">
							<label htmlFor="preferredSkills" className="block text-sm font-medium text-gray-700 mb-2">
								Preferred Skills
							</label>
							<input
								id="preferredSkills"
								type="text"
								value={preferredSkills}
								onChange={e => setPreferredSkills(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="TypeScript, AWS, Docker (comma separated)"
							/>
						</div>
					</div>

					{/* Phase 3: Advanced Features */}
					<div className="bg-indigo-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Company & Process Information</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							<div>
								<label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-2">
									Company Size
								</label>
								<select
									id="companySize"
									value={companySize}
									onChange={e => setCompanySize(e.target.value as CompanySize)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{COMPANY_SIZE_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
									Industry
								</label>
								<select
									id="industry"
									value={industry}
									onChange={e => setIndustry(e.target.value as Industry)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{INDUSTRY_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="urgencyLevel" className="block text-sm font-medium text-gray-700 mb-2">
									Urgency Level
								</label>
								<select
									id="urgencyLevel"
									value={urgencyLevel}
									onChange={e => setUrgencyLevel(e.target.value as UrgencyLevel)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{URGENCY_LEVEL_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
							<div>
								<label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
									Start Date
								</label>
								<select
									id="startDate"
									value={startDate}
									onChange={e => setStartDate(e.target.value as StartDate)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{START_DATE_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
									Application Deadline (Optional)
								</label>
								<input
									id="applicationDeadline"
									type="date"
									value={applicationDeadline}
									onChange={e => setApplicationDeadline(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
						</div>
					</div>

					{/* Application Process */}
					<div className="bg-orange-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Application Process</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label htmlFor="applicationProcess" className="block text-sm font-medium text-gray-700 mb-2">
									Application Process
								</label>
								<select
									id="applicationProcess"
									value={applicationProcess}
									onChange={e => setApplicationProcess(e.target.value as ApplicationProcess)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{APPLICATION_PROCESS_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="interviewRounds" className="block text-sm font-medium text-gray-700 mb-2">
									Interview Rounds
								</label>
								<select
									id="interviewRounds"
									value={interviewRounds}
									onChange={e => setInterviewRounds(e.target.value as InterviewRounds)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{INTERVIEW_ROUNDS_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="mt-6">
							<label htmlFor="applicationQuestions" className="block text-sm font-medium text-gray-700 mb-2">
								Application Questions (Optional)
							</label>
							<textarea
								id="applicationQuestions"
								value={applicationQuestions}
								onChange={e => setApplicationQuestions(e.target.value)}
								rows={4}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="¿Por qué quieres trabajar en nuestra empresa?&#10;¿Cuál es tu experiencia con React?"
							/>
							<p className="text-xs text-gray-500 mt-1">Una pregunta por línea</p>
						</div>
						<div className="mt-6">
							<label htmlFor="requiredDocuments" className="block text-sm font-medium text-gray-700 mb-2">
								Required Documents
							</label>
							<input
								id="requiredDocuments"
								type="text"
								value={requiredDocuments}
								onChange={e => setRequiredDocuments(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="CV, Portafolio, Carta de presentación (comma separated)"
							/>
						</div>
					</div>

					{/* Benefits & Culture */}
					<div className="bg-pink-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Benefits & Company Culture</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Benefits (Select all that apply)
								</label>
								<div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
									{BENEFITS_OPTIONS.map(benefit => (
										<label key={benefit.value} className="flex items-center text-sm">
											<input
												type="checkbox"
												checked={selectedBenefits.includes(benefit.value)}
												onChange={e => {
													if (e.target.checked) {
														setSelectedBenefits([...selectedBenefits, benefit.value])
													} else {
														setSelectedBenefits(selectedBenefits.filter(b => b !== benefit.value))
													}
												}}
												className="mr-2"
											/>
											{benefit.label}
										</label>
									))}
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Company Culture (Select all that apply)
								</label>
								<div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
									{COMPANY_CULTURE_OPTIONS.map(culture => (
										<label key={culture.value} className="flex items-center text-sm">
											<input
												type="checkbox"
												checked={selectedCulture.includes(culture.value)}
												onChange={e => {
													if (e.target.checked) {
														setSelectedCulture([...selectedCulture, culture.value])
													} else {
														setSelectedCulture(selectedCulture.filter(c => c !== culture.value))
													}
												}}
												className="mr-2"
											/>
											{culture.label}
										</label>
									))}
								</div>
							</div>
						</div>
					</div>

					{/* External Job Boards */}
					<div className="bg-cyan-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">External Job Boards</h2>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Post to External Job Boards (Select all that apply)
							</label>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-gray-300 rounded-md p-3">
								{EXTERNAL_JOB_BOARDS.map(board => (
									<label key={board.value} className="flex items-center text-sm">
										<input
											type="checkbox"
											checked={selectedJobBoards.includes(board.value)}
											onChange={e => {
												if (e.target.checked) {
													setSelectedJobBoards([...selectedJobBoards, board.value])
												} else {
													setSelectedJobBoards(selectedJobBoards.filter(b => b !== board.value))
												}
											}}
											className="mr-2"
										/>
										{board.label}
									</label>
								))}
							</div>
						</div>
					</div>

					{/* Internal Notes */}
					<div className="bg-gray-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Internal Notes</h2>
						<div>
							<label htmlFor="internalNotes" className="block text-sm font-medium text-gray-700 mb-2">
								Internal Notes (Not visible to candidates)
							</label>
							<textarea
								id="internalNotes"
								value={internalNotes}
								onChange={e => setInternalNotes(e.target.value)}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Notes for internal use only..."
							/>
						</div>
					</div>

					{/* Tier Selection */}
					<div className="bg-purple-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Choose a Posting Tier</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div
								onClick={() => setSelectedTier('clasica')}
								className={`p-6 border rounded-lg cursor-pointer text-center transition-all ${
									selectedTier === 'clasica'
										? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
										: 'border-gray-300 hover:border-blue-300'
								}`}
							>
								<h3 className="text-lg font-bold">Clásica</h3>
								<p className="text-gray-600 text-sm">Basic visibility</p>
								<p className="text-xs text-gray-500 mt-2">Standard job posting</p>
							</div>
							<div
								onClick={() => setSelectedTier('destacada')}
								className={`p-6 border rounded-lg cursor-pointer text-center transition-all ${
									selectedTier === 'destacada'
										? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
										: 'border-gray-300 hover:border-blue-300'
								}`}
							>
								<h3 className="text-lg font-bold">Destacada</h3>
								<p className="text-gray-600 text-sm">Higher search placement</p>
								<p className="text-xs text-gray-500 mt-2">Featured in search results</p>
							</div>
							<div
								onClick={() => setSelectedTier('premium')}
								className={`p-6 border rounded-lg cursor-pointer text-center transition-all ${
									selectedTier === 'premium'
										? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
										: 'border-gray-300 hover:border-blue-300'
								}`}
							>
								<h3 className="text-lg font-bold">Premium</h3>
								<p className="text-gray-600 text-sm">Top placement & AI features</p>
								<p className="text-xs text-gray-500 mt-2">Maximum visibility</p>
							</div>
						</div>
					</div>

					{/* Submission */}
					<div className="flex justify-end">
						<button
							type="submit"
							disabled={loading}
							className="px-8 py-3 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-semibold text-lg"
						>
							{loading ? 'Creating Job Posting...' : 'Proceed to Payment'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default NewJobPostingPage