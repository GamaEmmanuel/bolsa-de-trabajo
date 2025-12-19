'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { JobPosting } from '../../../types'
import { db } from '../../../lib/firebase'
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'

// Extend the JobPosting interface for additional fields
declare module '../../../types' {
	interface JobPosting {
		companyName?: string
		companyLogoUrl?: string
		location?: string
	}
}

interface JobFilters {
	keyword: string
	location: string
	jobType: string
	salaryMin: string
	salaryMax: string
	experience: string
	remote: boolean
}

const JobsPageContent = () => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const companyIdParam = searchParams?.get('companyId')

	const [jobs, setJobs] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [companyName, setCompanyName] = useState<string | null>(null)
	const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)
	const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({})
	const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({})
	const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
	const [imageRetries, setImageRetries] = useState<Record<string, number>>({})
	const [filters, setFilters] = useState<JobFilters>({
		keyword: '',
		location: '',
		jobType: '',
		salaryMin: '',
		salaryMax: '',
		experience: '',
		remote: false,
	})
	const [sortBy, setSortBy] = useState<'date' | 'salary' | 'relevance'>('date')

	// Fetch company name if companyId is provided
	useEffect(() => {
		const fetchCompanyName = async () => {
			if (!companyIdParam) {
				setCompanyName(null)
				return
			}

			try {
				const userDoc = await getDoc(doc(db, 'users', companyIdParam))
				if (userDoc.exists()) {
					const userData = userDoc.data()

					// Get company name from companyData (matching job detail page)
					if (userData.companyData?.companyName) {
						setCompanyName(userData.companyData.companyName)
					}

					// Get logo from companies collection
					const actualCompanyId = userData.companyId || companyIdParam
					const companyDoc = await getDoc(doc(db, 'companies', actualCompanyId))
					if (companyDoc.exists()) {
						const companyData = companyDoc.data()
						if (companyData.logoUrl) {
							setCompanyLogoUrl(companyData.logoUrl)
						}
					}
				}
			} catch (err) {
				console.error('Error fetching company data:', err)
			}
		}

		fetchCompanyName()
	}, [companyIdParam])

	// Helper function to get cached logo from localStorage
	const getCachedLogo = (companyId: string): string | null => {
		try {
			const cached = localStorage.getItem(`logo_${companyId}`)
			if (cached) {
				const { url, timestamp } = JSON.parse(cached)
				// Cache valid for 24 hours
				const cacheAge = Date.now() - timestamp
				const cacheMaxAge = 24 * 60 * 60 * 1000 // 24 hours
				if (cacheAge < cacheMaxAge) {
					return url
				}
			}
		} catch (err) {
			console.warn('Error reading logo cache:', err)
		}
		return null
	}

	// Helper function to cache logo in localStorage
	const cacheLogo = (companyId: string, url: string) => {
		try {
			localStorage.setItem(`logo_${companyId}`, JSON.stringify({
				url,
				timestamp: Date.now()
			}))
		} catch (err) {
			console.warn('Error caching logo:', err)
		}
	}

	// Fetch company logos for all jobs with caching and validation
	useEffect(() => {
		const fetchCompanyLogos = async () => {
			if (jobs.length === 0) return

			// Get unique company IDs, filtering out mock/invalid IDs
			const uniqueCompanyIds = [...new Set(
				jobs
					.map(job => job.companyId)
					.filter(id => id && id !== 'mock-company-id' && !id.includes('mock'))
			)]
			console.log('🏢 Fetching logos for', uniqueCompanyIds.length, 'companies')

			const logos: Record<string, string> = {}
			let cacheHits = 0
			let cacheMisses = 0

			// Fetch each company's logo
			await Promise.all(
				uniqueCompanyIds.map(async (companyId) => {
					try {
						// First check cache
						const cachedUrl = getCachedLogo(companyId as string)
						if (cachedUrl) {
							logos[companyId as string] = cachedUrl
							cacheHits++
							return
						}

						cacheMisses++

						// First try to get companyId from users collection
						const userDoc = await getDoc(doc(db, 'users', companyId as string))
						if (userDoc.exists()) {
							const userData = userDoc.data()
							const actualCompanyId = userData.companyId || companyId

							// Fetch from companies collection
							const companyDoc = await getDoc(doc(db, 'companies', actualCompanyId))
							if (companyDoc.exists()) {
								const companyData = companyDoc.data()
								if (companyData.logoUrl) {
									const logoUrl = companyData.logoUrl
									logos[companyId as string] = logoUrl
									// Cache the logo URL
									cacheLogo(companyId as string, logoUrl)
								} else {
									console.log(`⚠️ No logoUrl found for company: ${companyId}`)
								}
							}
						}
					} catch (err: any) {
						// Silently skip permission errors for mock or invalid companies
						if (err?.code !== 'permission-denied') {
							console.error('❌ Error fetching logo for company:', companyId, err)
						}
					}
				})
			)

			console.log(`✅ Logos fetched: ${Object.keys(logos).length} total (${cacheHits} from cache, ${cacheMisses} from database)`)
			setCompanyLogos(logos)
		}

		fetchCompanyLogos()
	}, [jobs])

	// Fetch jobs from database
	useEffect(() => {
		let q

		// If companyId is provided, filter by company
		if (companyIdParam) {
			q = query(
				collection(db, 'jobPostings'),
				where('companyId', '==', companyIdParam),
				where('status', '==', 'published'),
				orderBy('postedDate', 'desc')
			)
		} else {
			q = query(
				collection(db, 'jobPostings'),
				where('status', '==', 'published'),
				orderBy('postedDate', 'desc')
			)
		}

		const unsubscribe = onSnapshot(q,
			async (querySnapshot) => {
				const jobsData: JobPosting[] = []
				querySnapshot.forEach(doc => {
					jobsData.push({ jobId: doc.id, ...doc.data() } as JobPosting)
				})
				console.log('Fetched jobs:', jobsData.length, 'jobs found')

				// Enrich jobs with company names (matching job detail page approach)
				const enrichedJobs = await Promise.all(
					jobsData.map(async (job) => {
						// Skip enrichment for jobs with mock or invalid company IDs
						if (!job.companyName && job.companyId && job.companyId !== 'mock-company-id' && !job.companyId.includes('mock')) {
							try {
								// Get company data from users collection (same as job detail page)
								const userDoc = await getDoc(doc(db, 'users', job.companyId))
								if (userDoc.exists()) {
									const userData = userDoc.data()
									// First try companyData (if it exists)
									if (userData.companyData?.companyName) {
										job.companyName = userData.companyData.companyName
									} else {
										// Fallback: try fetching from companies collection
										const actualCompanyId = userData.companyId || job.companyId
										const companyDoc = await getDoc(doc(db, 'companies', actualCompanyId))
										if (companyDoc.exists()) {
											const companyData = companyDoc.data()
											job.companyName = companyData.companyName || 'Nombre de la Empresa'
										}
									}
								}
							} catch (err: any) {
								// Silently skip permission errors for mock companies
								if (err?.code !== 'permission-denied') {
									console.error('Error fetching company name for job:', job.jobId, err)
								}
							}
						}
						return job
					})
				)

				console.log('Jobs enriched with company names:', enrichedJobs)
				setJobs(enrichedJobs)
				setLoading(false)
			},
			(error) => {
				console.error('Error fetching job postings:', error)
				setError('Error al cargar las publicaciones de empleo. Por favor, inténtalo de nuevo.')
				setLoading(false)
			}
		)

		return () => unsubscribe()
	}, [companyIdParam])

	// Filter and sort jobs
	const filteredJobs = useMemo(() => {
		const filtered = jobs.filter(job => {
			// Keyword filter
			if (filters.keyword) {
				const keyword = filters.keyword.toLowerCase()
				const matchesTitle = job.jobTitle?.toLowerCase().includes(keyword)
				const matchesDescription = job.jobDescription?.toLowerCase().includes(keyword)
				const matchesCompany = job.companyName?.toLowerCase().includes(keyword)
				if (!matchesTitle && !matchesDescription && !matchesCompany) return false
			}

			// Location filter
			if (filters.location) {
				const location = filters.location.toLowerCase()
				const jobLocation = job.location?.toLowerCase() || ''
				if (!jobLocation.includes(location) && !jobLocation.includes('remote')) return false
			}

			// Remote filter
			if (filters.remote) {
				const jobLocation = job.location?.toLowerCase() || ''
				if (!jobLocation.includes('remote')) return false
			}

			// Job type filter
			if (filters.jobType && job.jobType !== filters.jobType) return false

			// Salary filter
			if (filters.salaryMin && job.salaryMin) {
				if (job.salaryMin < parseInt(filters.salaryMin)) return false
			}
			if (filters.salaryMax && job.salaryMax) {
				if (job.salaryMax > parseInt(filters.salaryMax)) return false
			}

			return true
		})

		// Sort jobs
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'salary':
					return (b.salaryMin || 0) - (a.salaryMin || 0)
				case 'relevance':
					// Simple relevance based on keyword matches
					if (filters.keyword) {
						const keyword = filters.keyword.toLowerCase()
						const aMatches = (a.jobTitle?.toLowerCase().includes(keyword) ? 2 : 0) +
							(a.jobDescription?.toLowerCase().includes(keyword) ? 1 : 0)
						const bMatches = (b.jobTitle?.toLowerCase().includes(keyword) ? 2 : 0) +
							(b.jobDescription?.toLowerCase().includes(keyword) ? 1 : 0)
						return bMatches - aMatches
					}
					return 0
				case 'date':
				default:
					return new Date(b.postedDate || '').getTime() - new Date(a.postedDate || '').getTime()
			}
		})

		return filtered
	}, [jobs, filters, sortBy])

	const handleFilterChange = (key: keyof JobFilters, value: string | boolean) => {
		setFilters(prev => ({ ...prev, [key]: value }))
	}

	const clearFilters = () => {
		setFilters({
			keyword: '',
			location: '',
			jobType: '',
			salaryMin: '',
			salaryMax: '',
			experience: '',
			remote: false,
		})
	}

	const clearCompanyFilter = () => {
		router.push('/candidate/jobs')
	}

	// Handle image load success
	const handleImageLoad = (companyId: string) => {
		setImageLoadingStates(prev => ({ ...prev, [companyId]: false }))
		setImageErrors(prev => ({ ...prev, [companyId]: false }))
		console.log(`✅ Logo loaded successfully for: ${companyId}`)
	}

	// Handle image load error with retry logic
	const handleImageError = (companyId: string, companyName: string) => {
		const retries = imageRetries[companyId] || 0
		const maxRetries = 2

		console.error(`❌ Failed to load logo for ${companyName} (${companyId}), retry: ${retries}/${maxRetries}`)

		if (retries < maxRetries) {
			// Attempt retry after a short delay
			setTimeout(() => {
				setImageRetries(prev => ({ ...prev, [companyId]: retries + 1 }))
				// Force image reload by updating the key
				setCompanyLogos(prev => ({ ...prev }))
			}, 1000 * (retries + 1)) // Progressive delay: 1s, 2s
		} else {
			// Max retries reached, mark as error
			setImageLoadingStates(prev => ({ ...prev, [companyId]: false }))
			setImageErrors(prev => ({ ...prev, [companyId]: true }))
			console.error(`❌ Max retries reached for logo: ${companyId}`)

			// Remove from cache if it's there
			try {
				localStorage.removeItem(`logo_${companyId}`)
			} catch (err) {
				console.warn('Error removing from cache:', err)
			}
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
				<p className="ml-2 text-gray-600">Cargando empleos...</p>
			</div>
		)
	}

	const [showFilters, setShowFilters] = useState(false)

	return (
		<div className="space-y-4 md:space-y-6">
			{/* Company Filter Banner */}
			{companyIdParam && companyName && (
				<div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 md:p-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
							{/* Company Logo */}
							<div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border border-orange-300">
								{companyLogoUrl && !imageErrors[companyIdParam] ? (
									<>
										{imageLoadingStates[companyIdParam] && (
											<div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
										)}
										<img
											src={companyLogoUrl}
											alt={companyName}
											className="w-full h-full object-contain p-1"
											style={{ display: imageLoadingStates[companyIdParam] ? 'none' : 'block' }}
											onLoad={() => handleImageLoad(companyIdParam)}
											onError={() => handleImageError(companyIdParam, companyName)}
										/>
									</>
								) : (
									<span className="text-lg font-semibold text-orange-600">
										{companyName.charAt(0)}
									</span>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs md:text-sm font-semibold text-orange-900">
									Mostrando empleos de: <span className="font-bold truncate block sm:inline">{companyName}</span>
								</p>
								<p className="text-xs text-orange-700">
									{filteredJobs.length} {filteredJobs.length === 1 ? 'posición disponible' : 'posiciones disponibles'}
								</p>
							</div>
						</div>
						<button
							onClick={clearCompanyFilter}
							className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-xs md:text-sm font-medium w-full sm:w-auto flex-shrink-0"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
							Ver todos los empleos
						</button>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900">Encuentra Tu Próximo Empleo</h1>
					<p className="text-sm md:text-base text-gray-600 mt-1">
						{filteredJobs.length} empleo{filteredJobs.length !== 1 ? 's' : ''} encontrado{filteredJobs.length !== 1 ? 's' : ''}
					</p>
				</div>
				<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
					<label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Ordenar por:</label>
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as 'date' | 'salary' | 'relevance')}
						className="flex-1 sm:flex-initial px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-blue-500"
					>
						<option value="date">Fecha de Publicación</option>
						<option value="salary">Salario</option>
						<option value="relevance">Relevancia</option>
					</select>
				</div>
			</div>

			{/* Mobile Filter Toggle */}
			<button
				onClick={() => setShowFilters(!showFilters)}
				className="lg:hidden w-full px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
			>
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
				</svg>
				{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
			</button>

			{error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-md">
					<p className="text-red-600">{error}</p>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Filters Sidebar */}
				<div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
					<div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-base md:text-lg font-semibold text-gray-900">Filtros</h2>
							<button
								onClick={clearFilters}
								className="text-xs md:text-sm text-pink-600 hover:text-pink-800"
							>
								Limpiar Todo
							</button>
						</div>

						<div className="space-y-3 md:space-y-4">
							{/* Keyword Search */}
							<div>
								<label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
									Palabras Clave
								</label>
								<input
									type="text"
									placeholder="Título del empleo, empresa, habilidades..."
									value={filters.keyword}
									onChange={(e) => handleFilterChange('keyword', e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-blue-500"
								/>
							</div>

							{/* Location */}
							<div>
								<label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
									Ubicación
								</label>
								<input
									type="text"
									placeholder="Ciudad, estado, país..."
									value={filters.location}
									onChange={(e) => handleFilterChange('location', e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-blue-500"
								/>
							</div>

							{/* Remote Work */}
							<div className="flex items-center">
								<input
									type="checkbox"
									id="remote"
									checked={filters.remote}
									onChange={(e) => handleFilterChange('remote', e.target.checked)}
									className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
								/>
								<label htmlFor="remote" className="ml-2 text-xs md:text-sm text-gray-700">
									Solo remoto
								</label>
							</div>

							{/* Job Type */}
							<div>
								<label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
									Tipo de Empleo
								</label>
								<select
									value={filters.jobType}
									onChange={(e) => handleFilterChange('jobType', e.target.value)}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-blue-500"
								>
									<option value="">Todos los Tipos</option>
									<option value="full-time">Tiempo Completo</option>
									<option value="part-time">Medio Tiempo</option>
									<option value="contract">Contrato</option>
									<option value="internship">Prácticas</option>
								</select>
							</div>

							{/* Salary Range */}
							<div>
								<label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
									Rango Salarial (MXN)
								</label>
								<div className="grid grid-cols-2 gap-2">
									<input
										type="number"
										placeholder="Mín"
										value={filters.salaryMin}
										onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
										className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-blue-500"
									/>
									<input
										type="number"
										placeholder="Máx"
										value={filters.salaryMax}
										onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
										className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-blue-500"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Job Listings */}
				<div className="lg:col-span-3">
					{filteredJobs.length === 0 ? (
						<div className="text-center py-12">
							<div className="text-gray-400 text-4xl md:text-6xl mb-4">🔍</div>
							<h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No se encontraron empleos</h3>
							<p className="text-sm md:text-base text-gray-500">Intenta ajustar tus filtros para ver más resultados.</p>
						</div>
					) : (
						<div className="space-y-3 md:space-y-4">
							{filteredJobs.map(job => (
								<Link
									key={job.jobId}
									href={`/jobs/${job.jobId}`}
									className="block bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
								>
									<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
										<div className="flex-1 min-w-0">
											<div className="flex items-start gap-2 md:gap-3">
												{/* Company Logo */}
												<div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 relative">
													{companyLogos[job.companyId] && !imageErrors[job.companyId] ? (
														<>
															{imageLoadingStates[job.companyId] && (
																<div className="absolute inset-0 flex items-center justify-center">
																	<div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
																</div>
															)}
															<img
																key={`${job.companyId}-${imageRetries[job.companyId] || 0}`}
																src={companyLogos[job.companyId]}
																alt={job.companyName || 'Company'}
																className="w-full h-full object-contain p-1 transition-opacity duration-200"
																style={{
																	display: imageLoadingStates[job.companyId] ? 'none' : 'block',
																	opacity: imageLoadingStates[job.companyId] ? 0 : 1
																}}
																onLoad={() => handleImageLoad(job.companyId)}
																onError={() => handleImageError(job.companyId, job.companyName || 'Unknown Company')}
															/>
														</>
													) : (
														<span className="text-lg font-semibold text-gray-400">
															{job.companyName?.charAt(0) || 'C'}
														</span>
													)}
												</div>

												<div className="flex-1 min-w-0">
													<h3 className="text-base md:text-xl font-semibold text-gray-900 hover:text-pink-600 transition-colors truncate">
														{job.jobTitle}
													</h3>
													<p className="text-sm md:text-base text-gray-600 font-medium mt-1 truncate">
														{job.companyName || 'Nombre de la Empresa'}
													</p>
													<p className="text-xs md:text-sm text-gray-500 mt-1 truncate">
														{job.location || 'Ubicación no especificada'}
													</p>
													<div className="flex flex-wrap items-center gap-2 mt-2">
														{job.jobType && (
															<span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
																{job.jobType}
															</span>
														)}
														{job.salaryMin && job.salaryMax && !job.isSalaryHidden && (
															<span className="text-xs md:text-sm text-green-600 font-medium">
																${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} MXN
															</span>
														)}
													</div>
												</div>
											</div>
										</div>
										<div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:ml-4 flex-shrink-0">
											{job.postedDate && (
												<p className="text-xs text-gray-500 whitespace-nowrap">
													Publicado {new Date(job.postedDate).toLocaleDateString()}
												</p>
											)}
											<div className="text-pink-600 text-xs md:text-sm font-medium whitespace-nowrap">
												Ver Detalles →
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

const JobsPage = () => {
	return (
		<Suspense fallback={
			<div className="flex items-center justify-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
				<p className="ml-2 text-gray-600">Cargando empleos...</p>
			</div>
		}>
			<JobsPageContent />
		</Suspense>
	)
}

export default JobsPage
