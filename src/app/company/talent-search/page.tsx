'use client'

import React, { useState, useEffect } from 'react'
import { db, auth } from '../../../lib/firebase'
import { collection, query, onSnapshot, where, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import LocationSelector from '../../../components/ui/LocationSelector'
import Link from 'next/link'
import Image from 'next/image'

// Extended CandidateProfile interface for display
interface CandidateProfile {
	profileId: string
	userId: string
	firstName?: string
	lastName?: string
	fullName?: string
	headline?: string
	skills: string[]
	location?: string
	summary?: string
	workExperience?: any[]
	education?: any[]
	desiredSalary?: number
	availability?: string
	willingToRelocate?: boolean
	languages?: Record<string, string>
	email?: string
	phone?: string
	profilePictureUrl?: string
}

const TalentSearchPage = () => {
	const [filters, setFilters] = useState({
		skills: '',
		location: '',
	})
	const [allCandidates, setAllCandidates] = useState<CandidateProfile[]>([])
	const [results, setResults] = useState<CandidateProfile[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [user, setUser] = useState(auth.currentUser)
	const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null)
	const [showModal, setShowModal] = useState(false)

	// Fetch candidate profiles from database
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			if (!currentUser) {
				setLoading(false)
				return
			}

			// Query all candidate profiles
			const candidatesQuery = query(collection(db, 'candidateProfiles'))

			const unsubscribe = onSnapshot(candidatesQuery,
				async (querySnapshot) => {
					const candidatesData: CandidateProfile[] = []

					// Process each candidate profile
					const promises = querySnapshot.docs.map(async (docSnapshot) => {
						const data = docSnapshot.data()

						// Fetch additional user data from userAccounts for up-to-date info
						let userAccountData = null
						if (data.userId) {
							try {
								const userAccountRef = doc(db, 'userAccounts', data.userId)
								const userAccountDoc = await getDoc(userAccountRef)
								if (userAccountDoc.exists()) {
									userAccountData = userAccountDoc.data()
								}
							} catch (error) {
								console.error('Error fetching user account:', error)
							}
						}

						// Prioritize userAccounts data for names and profile picture
						const firstName = userAccountData?.firstName || data.firstName || ''
						const lastName = userAccountData?.lastName || data.lastName || ''
						const profilePictureUrl = userAccountData?.profilePictureUrl || data.profilePictureUrl || ''

						const candidate: CandidateProfile = {
							profileId: docSnapshot.id,
							userId: data.userId || '',
							firstName,
							lastName,
							fullName: firstName && lastName ? `${firstName} ${lastName}` : (data.fullName || 'Unknown'),
							headline: data.summary || 'Professional seeking opportunities',
							skills: data.skills || [],
							location: data.location || '',
							summary: data.summary || '',
							workExperience: data.experience || [],
							education: data.education || [],
							desiredSalary: data.desiredSalary,
							availability: data.availability,
							willingToRelocate: data.willingToRelocate,
							languages: data.languages,
							email: data.email,
							phone: data.phone,
							profilePictureUrl,
						}
						candidatesData.push(candidate)
					})

					await Promise.all(promises)
					setAllCandidates(candidatesData)
					setResults(candidatesData) // Initially show all candidates
					setLoading(false)
				},
				(error) => {
					console.error('Error fetching candidate profiles:', error)
					setError('Error al cargar los perfiles de candidatos')
					setLoading(false)
				}
			)

			return () => unsubscribe()
		})

		return () => unsubscribeAuth()
	}, [])

	const performSearch = () => {
		// Filter candidates based on search criteria
		let filteredResults = allCandidates

		// Filter by skills (AND logic - must have ALL skills)
		if (filters.skills.trim()) {
			const searchSkills = filters.skills.toLowerCase().split(',').map(s => s.trim())
			filteredResults = filteredResults.filter(candidate => {
				// Ensure skills is an array
				const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : []

				// Must match ALL search skills (AND logic)
				return searchSkills.every(searchSkill =>
					// Check in skills array
					candidateSkills.some(skill =>
						skill && skill.toLowerCase().includes(searchSkill)
					) ||
					// Check in headline
					(candidate.headline && candidate.headline.toLowerCase().includes(searchSkill)) ||
					// Check in summary
					(candidate.summary && candidate.summary.toLowerCase().includes(searchSkill)) ||
					// Check in full name
					(candidate.fullName && candidate.fullName.toLowerCase().includes(searchSkill))
				)
			})
		}

		// Filter by location
		if (filters.location.trim()) {
			const searchLocation = filters.location.toLowerCase()
			filteredResults = filteredResults.filter(candidate =>
				candidate.location && candidate.location.toLowerCase().includes(searchLocation)
			)
		}

		console.log('Filtered results:', filteredResults.length, 'out of', allCandidates.length)
		setResults(filteredResults)
	}

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		performSearch()
	}

	const handleClearSearch = () => {
		setFilters({ skills: '', location: '' })
		setResults(allCandidates)
	}

	const handleViewProfile = (candidate: CandidateProfile) => {
		setSelectedCandidate(candidate)
		setShowModal(true)
	}

	const handleCloseModal = () => {
		setShowModal(false)
		setSelectedCandidate(null)
	}

	// Auto-search when filters change
	useEffect(() => {
		performSearch()
	}, [filters.skills, filters.location, allCandidates])

	// Show loading state
	if (loading) {
		return (
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="text-center py-12">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<p className="mt-2 text-muted-foreground">Cargando perfiles de candidatos...</p>
				</div>
			</div>
		)
	}

	// Show error state
	if (error) {
		return (
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="text-center py-12">
					<p className="text-red-500">{error}</p>
				</div>
			</div>
		)
	}

	// Show authentication required
	if (!user) {
		return (
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="text-center py-12">
					<p className="text-muted-foreground">Por favor, inicia sesión para buscar talento.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-2">Búsqueda de Talento</h1>
				<p className="text-muted-foreground">
					Busca en nuestra base de datos de {allCandidates.length} perfiles de candidatos para encontrar la coincidencia perfecta
				</p>
			</div>

			{/* Search and Filter Form */}
			<div className="bg-orange-50 p-6 rounded-xl shadow-sm mb-8">
				<form onSubmit={handleSearch} className="flex gap-4">
						<input
							type="text"
							placeholder="Habilidades (ej., React, Python)"
							className="flex-grow px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
							value={filters.skills}
							onChange={e => setFilters({ ...filters, skills: e.target.value })}
						/>
						<LocationSelector
							value={filters.location}
							onChange={(locationData) => {
								if (locationData) {
									const locationString = locationData.city + (locationData.state ? `, ${locationData.state}` : '')
									setFilters({ ...filters, location: locationString })
								} else {
									setFilters({ ...filters, location: '' })
								}
							}}
							placeholder="Ubicación (ej., Ciudad de México, Remoto)"
							className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
						/>
						<button
							type="submit"
							className="px-6 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-all duration-200"
						>
						Buscar
					</button>
					{(filters.skills || filters.location) && (
						<button
							type="button"
							onClick={handleClearSearch}
							className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
						>
							Limpiar
						</button>
					)}
				</form>
			</div>

			{/* Search Results */}
			<div className="mb-4">
				<p className="text-muted-foreground">
					Mostrando {results.length} candidato{results.length !== 1 ? 's' : ''}
					{(filters.skills || filters.location) && ` que coinciden con tus criterios de búsqueda`}
				</p>
			</div>

			{results.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground">
						{allCandidates.length === 0
							? "No se encontraron perfiles de candidatos en la base de datos."
							: "Ningún candidato coincide con tus criterios de búsqueda. Intenta ajustar tus filtros."
						}
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{results.map(candidate => (
						<div
							key={candidate.profileId}
							className="bg-card p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
							onClick={() => handleViewProfile(candidate)}
						>
							<div className="flex justify-between items-start gap-4">
								{/* Profile Picture */}
								{candidate.profilePictureUrl ? (
									<div className="flex-shrink-0">
										<Image
											src={candidate.profilePictureUrl}
											alt={candidate.fullName || 'Candidate'}
											width={64}
											height={64}
											className="rounded-full object-cover border-2 border-gray-200"
										/>
									</div>
								) : (
									<div className="flex-shrink-0 w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center border-2 border-gray-200">
										<span className="text-2xl font-bold text-pink-600">
											{candidate.fullName?.charAt(0).toUpperCase() || '?'}
										</span>
									</div>
								)}

								<div className="flex-grow">
									<div className="flex items-center justify-between mb-2">
										<h2 className="text-xl font-bold text-foreground">{candidate.fullName}</h2>
										{candidate.location && (
											<span className="text-sm text-muted-foreground ml-4">📍 {candidate.location}</span>
										)}
									</div>
									<p className="text-muted-foreground mb-3">{candidate.headline}</p>
									<div className="flex flex-wrap gap-2">
										{candidate.skills.slice(0, 6).map(skill => (
											<span
												key={skill}
												className="px-2 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded-full"
											>
												{skill}
											</span>
										))}
										{candidate.skills.length > 6 && (
											<span className="px-2 py-1 text-xs text-muted-foreground">
												+{candidate.skills.length - 6} más
											</span>
										)}
									</div>
								</div>
								<Link
									href={`/company/inbox?candidateId=${candidate.userId}&candidateName=${encodeURIComponent(candidate.fullName || 'Candidato')}`}
									className="ml-4 px-6 py-2 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-200 whitespace-nowrap"
									onClick={(e) => e.stopPropagation()}
								>
									Contactar
								</Link>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Candidate Profile Modal */}
			{showModal && selectedCandidate && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
					<div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
						{/* Modal Header */}
						<div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
							<div className="flex items-start gap-4 flex-grow">
								{/* Profile Picture */}
								{selectedCandidate.profilePictureUrl ? (
									<Image
										src={selectedCandidate.profilePictureUrl}
										alt={selectedCandidate.fullName || 'Candidate'}
										width={80}
										height={80}
										className="rounded-full object-cover border-2 border-gray-200"
									/>
								) : (
									<div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center border-2 border-gray-200">
										<span className="text-3xl font-bold text-pink-600">
											{selectedCandidate.fullName?.charAt(0).toUpperCase() || '?'}
										</span>
									</div>
								)}

								<div className="flex-grow">
									<h2 className="text-3xl font-bold text-gray-900 mb-1">{selectedCandidate.fullName}</h2>
									<p className="text-lg text-gray-600">{selectedCandidate.headline}</p>
									{selectedCandidate.location && (
										<p className="text-sm text-gray-500 mt-1">📍 {selectedCandidate.location}</p>
									)}
								</div>
							</div>
							<button
								onClick={handleCloseModal}
								className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4 flex-shrink-0"
							>
								×
							</button>
						</div>

						{/* Modal Body */}
						<div className="p-6 space-y-6">
							{/* Key Information Cards */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{selectedCandidate.desiredSalary && (
									<div className="bg-blue-50 p-4 rounded-lg">
										<p className="text-sm text-gray-600 mb-1">💰 Salario Deseado</p>
										<p className="text-lg font-semibold text-gray-900">
											${selectedCandidate.desiredSalary.toLocaleString('es-MX')} MXN
										</p>
									</div>
								)}
								{selectedCandidate.availability && (
									<div className="bg-green-50 p-4 rounded-lg">
										<p className="text-sm text-gray-600 mb-1">📅 Disponibilidad</p>
										<p className="text-lg font-semibold text-gray-900">{selectedCandidate.availability}</p>
									</div>
								)}
								{selectedCandidate.willingToRelocate !== undefined && (
									<div className="bg-purple-50 p-4 rounded-lg">
										<p className="text-sm text-gray-600 mb-1">🌍 Disposición a Relocalizarse</p>
										<p className="text-lg font-semibold text-gray-900">
											{selectedCandidate.willingToRelocate ? 'Sí' : 'No'}
										</p>
									</div>
								)}
							</div>

							{/* Summary */}
							{selectedCandidate.summary && (
								<div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3">📝 Resumen</h3>
									<p className="text-gray-700 leading-relaxed">{selectedCandidate.summary}</p>
								</div>
							)}

							{/* Skills */}
							{selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
								<div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3">💡 Habilidades</h3>
									<div className="flex flex-wrap gap-2">
										{selectedCandidate.skills.map(skill => (
											<span
												key={skill}
												className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full"
											>
												{skill}
											</span>
										))}
									</div>
								</div>
							)}

							{/* Languages */}
							{selectedCandidate.languages && Object.keys(selectedCandidate.languages).length > 0 && (
								<div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3">🌐 Idiomas</h3>
									<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
										{Object.entries(selectedCandidate.languages).map(([language, level]) => (
											<div key={language} className="bg-gray-50 p-3 rounded-lg">
												<p className="font-semibold text-gray-900">{language}</p>
												<p className="text-sm text-gray-600">{level}</p>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Work Experience */}
							{selectedCandidate.workExperience && selectedCandidate.workExperience.length > 0 && (
								<div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3">💼 Experiencia Laboral</h3>
									<div className="space-y-4">
										{selectedCandidate.workExperience.map((exp: any, index: number) => (
											<div key={index} className="border-l-4 border-blue-500 pl-4">
												<h4 className="font-semibold text-gray-900">{exp.position || exp.title}</h4>
												<p className="text-gray-600">{exp.company}</p>
												<p className="text-sm text-gray-500">
													{exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.years || 'Fecha no especificada'}
												</p>
												{exp.description && (
													<p className="text-gray-700 mt-2">{exp.description}</p>
												)}
												{exp.achievements && exp.achievements.length > 0 && (
													<ul className="list-disc list-inside mt-2 text-gray-700">
														{exp.achievements.map((achievement: string, idx: number) => (
															<li key={idx}>{achievement}</li>
														))}
													</ul>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Education */}
							{selectedCandidate.education && selectedCandidate.education.length > 0 && (
								<div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3">🎓 Educación</h3>
									<div className="space-y-4">
										{selectedCandidate.education.map((edu: any, index: number) => (
											<div key={index} className="border-l-4 border-green-500 pl-4">
												<h4 className="font-semibold text-gray-900">{edu.degree || edu.fieldOfStudy}</h4>
												<p className="text-gray-600">{edu.school || edu.institution}</p>
												<p className="text-sm text-gray-500">
													{edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.graduationYear || 'Fecha no especificada'}
												</p>
												{edu.gpa && (
													<p className="text-sm text-gray-600 mt-1">GPA: {edu.gpa}</p>
												)}
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Modal Footer */}
						<div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-4">
							<button
								onClick={handleCloseModal}
								className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
							>
								Cerrar
							</button>
							<Link
								href={`/company/inbox?candidateId=${selectedCandidate.userId}&candidateName=${encodeURIComponent(selectedCandidate.fullName || 'Candidato')}`}
								className="px-6 py-2 text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-all duration-200"
							>
								Contactar
							</Link>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default TalentSearchPage