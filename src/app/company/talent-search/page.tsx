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
					setError('Failed to load candidate profiles')
					setLoading(false)
				}
			)

			return () => unsubscribe()
		})

		return () => unsubscribeAuth()
	}, [])

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		console.log('Searching for talent with filters:', filters)

		// Filter candidates based on search criteria
		let filteredResults = allCandidates

		// Filter by skills
		if (filters.skills.trim()) {
			const searchSkills = filters.skills.toLowerCase().split(',').map(s => s.trim())
			filteredResults = filteredResults.filter(candidate =>
				searchSkills.some(searchSkill =>
					candidate.skills.some(skill =>
						skill.toLowerCase().includes(searchSkill)
					) ||
					candidate.headline?.toLowerCase().includes(searchSkill) ||
					candidate.summary?.toLowerCase().includes(searchSkill)
				)
			)
		}

		// Filter by location
		if (filters.location.trim()) {
			const searchLocation = filters.location.toLowerCase()
			filteredResults = filteredResults.filter(candidate =>
				candidate.location?.toLowerCase().includes(searchLocation)
			)
		}

		setResults(filteredResults)
	}

	// Show loading state
	if (loading) {
		return (
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="text-center py-12">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<p className="mt-2 text-muted-foreground">Loading candidate profiles...</p>
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
					<p className="text-muted-foreground">Please sign in to search for talent.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-2">Talent Search</h1>
				<p className="text-muted-foreground">
					Search our database of {allCandidates.length} candidate profiles to find the perfect match
				</p>
			</div>

			{/* Search and Filter Form */}
			<div className="bg-card p-6 rounded-lg border border-border mb-8">
				<form onSubmit={handleSearch} className="flex gap-4">
					<input
						type="text"
						placeholder="Skills (e.g., React, Python)"
						className="flex-grow px-4 py-2 border rounded-md"
						value={filters.skills}
						onChange={e => setFilters({ ...filters, skills: e.target.value })}
					/>
					<input
						type="text"
						placeholder="Location (e.g., Mexico City, Remote)"
						className="px-4 py-2 border rounded-md"
						value={filters.location}
						onChange={e => setFilters({ ...filters, location: e.target.value })}
					/>
					<button
						type="submit"
						className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
					>
						Search
					</button>
				</form>
			</div>

			{/* Search Results */}
			<div className="mb-4">
				<p className="text-muted-foreground">
					Showing {results.length} candidate{results.length !== 1 ? 's' : ''}
					{(filters.skills || filters.location) && ` matching your search criteria`}
				</p>
			</div>

			{results.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground">
						{allCandidates.length === 0
							? "No candidate profiles found in the database."
							: "No candidates match your search criteria. Try adjusting your filters."
						}
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{results.map(candidate => (
						<div
							key={candidate.profileId}
							className="bg-card p-6 rounded-lg border border-border flex justify-between items-start"
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
											+{candidate.skills.length - 6} more
										</span>
									)}
								</div>
							</div>
							<button className="ml-4 px-4 py-2 text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap">
								Unlock Contact Info
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default TalentSearchPage