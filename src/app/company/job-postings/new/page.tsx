'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db, auth } from '../../../../lib/firebase'
import { collection, addDoc, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { JobTier, JobStatus, JobType, EmploymentType, ExperienceLevel, EducationLevel, JobCategory, JobLevel, StartDate, UrgencyLevel, ApplicationProcess, InterviewRounds } from '../../../../../types'
import {
	JOB_TYPE_OPTIONS,
	EMPLOYMENT_TYPE_OPTIONS,
	EXPERIENCE_LEVEL_OPTIONS,
	EDUCATION_LEVEL_OPTIONS,
	JOB_CATEGORY_OPTIONS,
	JOB_LEVEL_OPTIONS,
	MEXICAN_CITIES,
	START_DATE_OPTIONS,
	URGENCY_LEVEL_OPTIONS,
	APPLICATION_PROCESS_OPTIONS,
	INTERVIEW_ROUNDS_OPTIONS
} from '../../../../lib/constants'
import LocationSelector from '../../../../components/ui/LocationSelector'
import { formatNumberWithCommas, parseFormattedNumber } from '../../../../lib/utils'
import { useStripeCheckout } from '../../../../lib/useStripeCheckout'
import Link from 'next/link'

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
	const [requiredSkills, setRequiredSkills] = useState<string[]>([])
	const [customRequiredSkill, setCustomRequiredSkill] = useState('')
	const [preferredSkills, setPreferredSkills] = useState<string[]>([])
	const [customPreferredSkill, setCustomPreferredSkill] = useState('')
	const [jobCategory, setJobCategory] = useState<JobCategory>('other')
	const [jobLevel, setJobLevel] = useState<JobLevel>('mid-level')

	// Predefined professional skills
	const PROFESSIONAL_SKILLS = [
		'Atención al cliente',
		'Trabajo en equipo',
		'Comunicación efectiva',
		'Liderazgo',
		'Gestión de proyectos',
		'Análisis de datos',
		'Microsoft Office',
		'Excel avanzado',
		'Inglés conversacional',
		'Ventas y negociación',
		'Marketing digital',
		'Programación',
		'Diseño gráfico',
		'Contabilidad',
		'Administración',
		'Gestión de personal',
		'Resolución de problemas',
		'Planificación estratégica',
		'Manejo de presupuestos',
		'Servicio al cliente',
		'Logística',
		'Redes sociales',
		'CRM / ERP',
		'Presentaciones ejecutivas',
		'Organización de eventos'
	]

	// Phase 3 Fields
	const [applicationDeadline, setApplicationDeadline] = useState('')
	const [startDate, setStartDate] = useState<StartDate>('flexible')
	const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('normal')
	const [applicationProcess, setApplicationProcess] = useState<ApplicationProcess>('resume-only')
	const [interviewRounds, setInterviewRounds] = useState<InterviewRounds>('2')
	const [applicationQuestions, setApplicationQuestions] = useState('')
	const [requiredDocuments, setRequiredDocuments] = useState('')
	const [internalNotes, setInternalNotes] = useState('')

	// Tier and Status
	const [selectedTier, setSelectedTier] = useState<JobTier>('clasica')
	const [loading, setLoading] = useState(false)
	const [companyName, setCompanyName] = useState('')
	const [stripeCustomerId, setStripeCustomerId] = useState<string | undefined>()
	const router = useRouter()
	const { createCheckoutSession, loading: checkoutLoading } = useStripeCheckout()

	// Load company data on mount for Stripe checkout
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
			if (!currentUser) return

			try {
				const userRef = doc(db, 'users', currentUser.uid)
				const userDoc = await getDoc(userRef)

				if (userDoc.exists()) {
					const userData = userDoc.data()
					const companyId = userData.companyId

					if (companyId) {
						const companyRef = doc(db, 'companies', companyId)
						const companyDoc = await getDoc(companyRef)

						if (companyDoc.exists()) {
							const companyData = companyDoc.data()
							setCompanyName(companyData.companyName || '')
							setStripeCustomerId(companyData.stripeCustomerId)
						}
					}
				}
			} catch (error) {
				console.error('Error loading company data:', error)
			}
		})

		return () => unsubscribeAuth()
	}, [])

	const handleSave = async (status: JobStatus) => {
		if (!auth.currentUser) {
			alert('Debes iniciar sesión para crear una publicación de empleo.')
			return
		}

		setLoading(true)

		try {
			const companyId = auth.currentUser.uid

			// Prepare job posting data
			const jobData = {
				jobTitle,
				jobDescription,
				jobType,
				employmentType,
				yearsOfExperience,
				educationLevel,
				requiredSkills,
				preferredSkills,
				jobCategory,
				jobLevel,
				location,
				...(salaryMin && { salaryMin: parseInt(salaryMin) }),
				...(salaryMax && { salaryMax: parseInt(salaryMax) }),
				isSalaryHidden,
				...(applicationDeadline && { applicationDeadline }),
				startDate,
				urgencyLevel,
				applicationProcess,
				interviewRounds,
				applicationQuestions: applicationQuestions.split('\n').filter(q => q.trim()),
				requiredDocuments: requiredDocuments.split(',').map(d => d.trim()).filter(d => d),
				...(internalNotes && { internalNotes }),
				tier: selectedTier,
				status: 'draft' as JobStatus,
				paymentStatus: 'pending',
				createdByUserId: auth.currentUser.uid,
				companyId: companyId,
				postedDate: new Date().toISOString().split('T')[0],
			}

			// Always save as draft first
			const docRef = await addDoc(collection(db, 'jobPostings'), jobData)

			if (status === 'published') {
				// Redirect to Stripe checkout for payment
				await createCheckoutSession({
					companyId,
					userId: auth.currentUser.uid,
					email: auth.currentUser.email || '',
					companyName: companyName || 'Empresa',
					customerId: stripeCustomerId,
					jobPostingId: docRef.id,
				})
				// User will be redirected to Stripe, then back to job-postings on success
			} else {
				// Just save as draft and redirect
				router.push('/company/job-postings')
			}
		} catch (error) {
			console.error('Error creating job posting:', error)
			alert('Error al crear la publicación de empleo. Por favor, inténtalo de nuevo.')
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 p-3 sm:p-6 md:p-8">
			<div className="max-w-4xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md">
				<h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Crear Nueva Publicación de Empleo</h1>

				<div className="space-y-6 sm:space-y-8">
					{/* Basic Information */}
					<div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
						<h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Información Básica</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
							<div>
								<label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
									Título del Empleo *
						</label>
						<input
							id="jobTitle"
							type="text"
							value={jobTitle}
							onChange={e => setJobTitle(e.target.value)}
							required
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="ej., Gerente de Ventas, Desarrollador Web"
						/>
					</div>
							<div>
								<label htmlFor="jobCategory" className="block text-sm font-medium text-gray-700 mb-2">
									Categoría del Empleo *
								</label>
								<select
									id="jobCategory"
									value={jobCategory}
									onChange={e => setJobCategory(e.target.value as JobCategory)}
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{JOB_CATEGORY_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="mt-4 sm:mt-6">
							<label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
								Descripción del Empleo *
						</label>
						<textarea
							id="jobDescription"
							value={jobDescription}
							onChange={e => setJobDescription(e.target.value)}
							required
								rows={6}
								className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Describe el puesto, horarios, turnos, responsabilidades..."
							/>
						</div>
					</div>

					{/* Phase 1: Essential Fields */}
					<div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
						<h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Detalles del Empleo</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
							<div>
								<label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-2">
									Tipo de Empleo *
								</label>
								<select
									id="jobType"
									value={jobType}
									onChange={e => setJobType(e.target.value as JobType)}
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
									Modalidad de Trabajo *
								</label>
								<select
									id="employmentType"
									value={employmentType}
									onChange={e => setEmploymentType(e.target.value as EmploymentType)}
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
									Nivel del Empleo *
								</label>
								<select
									id="jobLevel"
									value={jobLevel}
									onChange={e => setJobLevel(e.target.value as JobLevel)}
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{JOB_LEVEL_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
							<div>
								<label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
									Años de Experiencia *
								</label>
								<select
									id="yearsOfExperience"
									value={yearsOfExperience}
									onChange={e => setYearsOfExperience(e.target.value as ExperienceLevel)}
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
									Ubicación *
								</label>
								<LocationSelector
									value={location}
									onChange={(locationData) => {
										if (locationData) {
											const locationString = locationData.city + (locationData.state ? `, ${locationData.state}` : '')
											setLocation(locationString)
										} else {
											setLocation('')
										}
									}}
									placeholder="Selecciona una ciudad"
									className="w-full"
								/>
							</div>
						</div>
					</div>

					{/* Salary Information */}
					<div className="bg-green-50 p-4 sm:p-6 rounded-lg">
						<h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Información Salarial</h2>
						<div className="space-y-4 sm:space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
								<div>
									<label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-2">
										Salario Mínimo (MXN) *
									</label>
									<div className="relative">
										<span className="absolute left-3 top-2.5 text-gray-500">$</span>
										<input
											id="salaryMin"
											type="number"
											value={salaryMin}
											onChange={e => setSalaryMin(e.target.value)}
											className="w-full pl-7 pr-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
											placeholder="25000"
											min="0"
											step="1000"
										/>
									</div>
								</div>
								<div>
									<label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-2">
										Salario Máximo (MXN) *
									</label>
									<div className="relative">
										<span className="absolute left-3 top-2.5 text-gray-500">$</span>
										<input
											id="salaryMax"
											type="number"
											value={salaryMax}
											onChange={e => setSalaryMax(e.target.value)}
											className="w-full pl-7 pr-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
											placeholder="50000"
											min="0"
											step="1000"
										/>
									</div>
								</div>
							</div>

							{/* Quick Salary Presets */}
							<div>
								<div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Configuraciones rápidas:</div>
								<div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
									<button
										type="button"
										onClick={() => {
											setSalaryMin('15000')
											setSalaryMax('25000')
										}}
										className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
									>
										$15k - $25k
									</button>
									<button
										type="button"
										onClick={() => {
											setSalaryMin('25000')
											setSalaryMax('40000')
										}}
										className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
									>
										$25k - $40k
									</button>
									<button
										type="button"
										onClick={() => {
											setSalaryMin('40000')
											setSalaryMax('60000')
										}}
										className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
									>
										$40k - $60k
									</button>
									<button
										type="button"
										onClick={() => {
											setSalaryMin('60000')
											setSalaryMax('100000')
										}}
										className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
									>
										$60k - $100k
									</button>
									<button
										type="button"
										onClick={() => {
											setSalaryMin('100000')
											setSalaryMax('200000')
										}}
										className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
									>
										$100k+
									</button>
								</div>
							</div>

							<div className="flex items-center">
								<label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-green-100 cursor-pointer transition-colors group">
									<div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
										<input
											type="checkbox"
											checked={isSalaryHidden}
											onChange={e => setIsSalaryHidden(e.target.checked)}
											className="peer sr-only"
										/>
										<div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-pink-600 peer-checked:bg-pink-600 transition-all duration-200 flex items-center justify-center group-hover:border-pink-400">
											<svg
												className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
											</svg>
										</div>
									</div>
									<span className="text-sm text-gray-700 select-none leading-relaxed">Ocultar salario del público</span>
								</label>
							</div>
						</div>
					</div>

					{/* Phase 2: Additional Requirements */}
					<div className="bg-yellow-50 p-4 sm:p-6 rounded-lg">
						<h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Requisitos y Habilidades</h2>

						{/* Education Level */}
						<div className="mb-6">
							<label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700 mb-2">
								Nivel de Educación *
							</label>
							<select
								id="educationLevel"
								value={educationLevel}
								onChange={e => setEducationLevel(e.target.value as EducationLevel)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
							>
								{EDUCATION_LEVEL_OPTIONS.map(option => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>

						{/* Required Skills */}
						<div className="mb-4 sm:mb-6">
							<label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
								Habilidades Requeridas
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3 sm:mb-4 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
								{PROFESSIONAL_SKILLS.map(skill => (
									<label
										key={skill}
										className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-pink-50 cursor-pointer transition-colors group min-h-[44px]"
									>
										<div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
											<input
												type="checkbox"
												checked={requiredSkills.includes(skill)}
												onChange={(e) => {
													if (e.target.checked) {
														setRequiredSkills([...requiredSkills, skill])
													} else {
														setRequiredSkills(requiredSkills.filter(s => s !== skill))
													}
												}}
												className="peer sr-only"
											/>
											<div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-pink-600 peer-checked:bg-pink-600 transition-all duration-200 flex items-center justify-center group-hover:border-pink-400">
												<svg
													className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
												</svg>
											</div>
										</div>
										<span className="text-sm text-gray-700 select-none leading-relaxed">{skill}</span>
									</label>
								))}
							</div>
							<div className="flex flex-col sm:flex-row gap-2">
								<input
									type="text"
									value={customRequiredSkill}
									onChange={e => setCustomRequiredSkill(e.target.value)}
									placeholder="Agregar habilidad personalizada"
									className="flex-1 px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
									onKeyPress={(e) => {
										if (e.key === 'Enter' && customRequiredSkill.trim()) {
											e.preventDefault()
											if (!requiredSkills.includes(customRequiredSkill.trim())) {
												setRequiredSkills([...requiredSkills, customRequiredSkill.trim()])
											}
											setCustomRequiredSkill('')
										}
									}}
								/>
								<button
									type="button"
									onClick={() => {
										if (customRequiredSkill.trim() && !requiredSkills.includes(customRequiredSkill.trim())) {
											setRequiredSkills([...requiredSkills, customRequiredSkill.trim()])
											setCustomRequiredSkill('')
										}
									}}
									className="px-4 py-2.5 sm:py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm font-medium whitespace-nowrap"
								>
									Agregar
								</button>
							</div>
							{requiredSkills.length > 0 && (
								<div className="mt-3 flex flex-wrap gap-2">
									{requiredSkills.map(skill => (
										<span
											key={skill}
											className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm"
										>
											{skill}
											<button
												type="button"
												onClick={() => setRequiredSkills(requiredSkills.filter(s => s !== skill))}
												className="hover:text-pink-900 ml-1 font-bold"
											>
												×
											</button>
										</span>
									))}
								</div>
							)}
						</div>

						{/* Preferred Skills */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-3">
								Habilidades Preferidas (Opcional)
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
								{PROFESSIONAL_SKILLS.map(skill => (
									<label
										key={skill}
										className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group min-h-[44px]"
									>
										<div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
											<input
												type="checkbox"
												checked={preferredSkills.includes(skill)}
												onChange={(e) => {
													if (e.target.checked) {
														setPreferredSkills([...preferredSkills, skill])
													} else {
														setPreferredSkills(preferredSkills.filter(s => s !== skill))
													}
												}}
												className="peer sr-only"
											/>
											<div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-all duration-200 flex items-center justify-center group-hover:border-blue-400">
												<svg
													className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
												</svg>
											</div>
										</div>
										<span className="text-sm text-gray-700 select-none leading-relaxed">{skill}</span>
									</label>
								))}
							</div>
							<div className="flex gap-2">
								<input
									type="text"
									value={customPreferredSkill}
									onChange={e => setCustomPreferredSkill(e.target.value)}
									placeholder="Agregar habilidad personalizada"
									className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
									onKeyPress={(e) => {
										if (e.key === 'Enter' && customPreferredSkill.trim()) {
											e.preventDefault()
											if (!preferredSkills.includes(customPreferredSkill.trim())) {
												setPreferredSkills([...preferredSkills, customPreferredSkill.trim()])
											}
											setCustomPreferredSkill('')
										}
									}}
								/>
								<button
									type="button"
									onClick={() => {
										if (customPreferredSkill.trim() && !preferredSkills.includes(customPreferredSkill.trim())) {
											setPreferredSkills([...preferredSkills, customPreferredSkill.trim()])
											setCustomPreferredSkill('')
										}
									}}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
								>
									Agregar
								</button>
							</div>
							{preferredSkills.length > 0 && (
								<div className="mt-3 flex flex-wrap gap-2">
									{preferredSkills.map(skill => (
										<span
											key={skill}
											className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
										>
											{skill}
											<button
												type="button"
												onClick={() => setPreferredSkills(preferredSkills.filter(s => s !== skill))}
												className="hover:text-blue-900 ml-1 font-bold"
											>
												×
											</button>
										</span>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Phase 3: Advanced Features */}
					<div className="bg-indigo-50 p-4 sm:p-6 rounded-lg">
						<h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Información del Proceso</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
							<div>
								<label htmlFor="urgencyLevel" className="block text-sm font-medium text-gray-700 mb-2">
									Nivel de Urgencia
								</label>
								<select
									id="urgencyLevel"
									value={urgencyLevel}
									onChange={e => setUrgencyLevel(e.target.value as UrgencyLevel)}
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{URGENCY_LEVEL_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
									Fecha de Inicio
								</label>
								<select
									id="startDate"
									value={startDate}
									onChange={e => setStartDate(e.target.value as StartDate)}
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{START_DATE_OPTIONS.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="mt-6">
								<label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
									Fecha Límite de Aplicación (Opcional)
								</label>
								<input
									id="applicationDeadline"
									type="date"
									value={applicationDeadline}
									onChange={e => setApplicationDeadline(e.target.value)}
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
						</div>
					</div>

					{/* Application Process */}
					<div className="bg-orange-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Proceso de Aplicación</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label htmlFor="applicationProcess" className="block text-sm font-medium text-gray-700 mb-2">
									Proceso de Aplicación
								</label>
								<select
									id="applicationProcess"
									value={applicationProcess}
									onChange={e => setApplicationProcess(e.target.value as ApplicationProcess)}
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
									Rondas de Entrevista
								</label>
								<select
									id="interviewRounds"
									value={interviewRounds}
									onChange={e => setInterviewRounds(e.target.value as InterviewRounds)}
									className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
								Preguntas de Aplicación (Opcional)
							</label>
							<textarea
								id="applicationQuestions"
								value={applicationQuestions}
								onChange={e => setApplicationQuestions(e.target.value)}
								rows={4}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="¿Por qué quieres trabajar en nuestra empresa?&#10;¿Cuál es tu experiencia más relevante para este puesto?&#10;¿Cuál es tu disponibilidad para comenzar?"
							/>
							<p className="text-xs text-gray-500 mt-1">Una pregunta por línea</p>
						</div>
						<div className="mt-6">
							<label htmlFor="requiredDocuments" className="block text-sm font-medium text-gray-700 mb-2">
								Documentos Requeridos
							</label>
							<input
								id="requiredDocuments"
								type="text"
								value={requiredDocuments}
								onChange={e => setRequiredDocuments(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="CV, Referencias laborales, Certificado de salud (separados por comas)"
							/>
						</div>
					</div>

					{/* Internal Notes */}
					<div className="bg-gray-50 p-6 rounded-lg">
						<h2 className="text-xl font-semibold mb-4">Notas Internas</h2>
						<div>
							<label htmlFor="internalNotes" className="block text-sm font-medium text-gray-700 mb-2">
								Notas Internas (No visible para candidatos)
							</label>
							<textarea
								id="internalNotes"
								value={internalNotes}
								onChange={e => setInternalNotes(e.target.value)}
								rows={3}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Notas para uso interno únicamente..."
							/>
						</div>
					</div>

					{/* Submission */}
					<div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
						<button
							type="button"
							onClick={() => handleSave('draft')}
							disabled={loading || checkoutLoading}
							className="px-6 sm:px-8 py-3 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:bg-gray-400 font-semibold text-base sm:text-lg order-2 sm:order-1"
						>
							{loading ? 'Guardando...' : 'Guardar Borrador'}
						</button>
						<button
							type="button"
							onClick={() => handleSave('published')}
							disabled={loading || checkoutLoading}
							className="px-6 sm:px-8 py-3 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-semibold text-base sm:text-lg order-1 sm:order-2"
						>
							{loading || checkoutLoading ? 'Procesando...' : 'Publicar - $10 MXN'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default NewJobPostingPage