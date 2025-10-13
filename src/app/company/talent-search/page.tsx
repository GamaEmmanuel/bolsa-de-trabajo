'use client'

import React, { useState, useEffect } from 'react'
import { db, auth } from '../../../lib/firebase'
import { collection, query, onSnapshot, where } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

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
				(querySnapshot) => {
					const candidatesData: CandidateProfile[] = []
					querySnapshot.forEach(doc => {
						const data = doc.data()
						const candidate: CandidateProfile = {
							profileId: doc.id,
							userId: data.userId || '',
							firstName: data.firstName || '',
							lastName: data.lastName || '',
							fullName: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : (data.fullName || 'Unknown'),
							headline: data.summary || 'Professional seeking opportunities',
							skills: data.skills || [],
							location: data.location || '',
							summary: data.summary || '',
							workExperience: data.experience || [],
							education: data.education || [],
						}
						candidatesData.push(candidate)
					})
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
						<input
							type="text"
							placeholder="Ubicación (ej., Ciudad de México, Remoto)"
							className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
							value={filters.location}
							onChange={e => setFilters({ ...filters, location: e.target.value })}
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
							className="bg-card p-6 rounded-xl shadow-sm flex justify-between items-start hover:shadow-md transition-all duration-200"
						>
							<div className="flex-grow">
								<h2 className="text-xl font-bold text-foreground">{candidate.fullName}</h2>
								<p className="text-muted-foreground mb-2">{candidate.headline}</p>
								{candidate.location && (
									<p className="text-sm text-muted-foreground mb-3">📍 {candidate.location}</p>
								)}
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
							<button className="ml-4 px-4 py-2 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-200 whitespace-nowrap">
								Desbloquear Información de Contacto
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default TalentSearchPage