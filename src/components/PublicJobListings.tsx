'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { JobPosting } from '../types'
import { db } from '../lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'

// Extend the JobPosting interface for additional fields
declare module '../types' {
	interface JobPosting {
		companyName?: string
		location?: string
	}
}

interface PublicJobListingsProps {
	showTotalCount?: boolean
}

const PublicJobListings: React.FC<PublicJobListingsProps> = ({ showTotalCount = true }) => {
	const [allJobs, setAllJobs] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const jobsPerPage = 20

	useEffect(() => {
		const q = query(
			collection(db, 'jobPostings'),
			where('status', '==', 'published'),
			orderBy('postedDate', 'desc')
		)

		const unsubscribe = onSnapshot(q,
			(querySnapshot) => {
				const jobsData: JobPosting[] = []
				querySnapshot.forEach(doc => {
					jobsData.push({ jobId: doc.id, ...doc.data() } as JobPosting)
				})
				setAllJobs(jobsData)
				setLoading(false)
			},
			(error) => {
				console.error('Error fetching job postings:', error)
				setError('Error al cargar las publicaciones de empleo.')
				setLoading(false)
			}
		)

		return () => unsubscribe()
	}, [])

	// Pagination logic
	const totalPages = Math.ceil(allJobs.length / jobsPerPage)
	const startIndex = (currentPage - 1) * jobsPerPage
	const endIndex = startIndex + jobsPerPage
	const currentJobs = allJobs.slice(startIndex, endIndex)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const renderPagination = () => {
		if (totalPages <= 1) return null

		const pages = []
		const maxVisiblePages = 5
		let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1)
		}

		// Previous button
		pages.push(
			<button
				key="prev"
				onClick={() => handlePageChange(currentPage - 1)}
				disabled={currentPage === 1}
				className={`px-3 py-2 rounded-lg font-medium ${
					currentPage === 1
						? 'bg-gray-100 text-gray-400 cursor-not-allowed'
						: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
				}`}
			>
				Anterior
			</button>
		)

		// First page
		if (startPage > 1) {
			pages.push(
				<button
					key={1}
					onClick={() => handlePageChange(1)}
					className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
				>
					1
				</button>
			)
			if (startPage > 2) {
				pages.push(
					<span key="ellipsis1" className="px-2 text-gray-500">
						...
					</span>
				)
			}
		}

		// Page numbers
		for (let i = startPage; i <= endPage; i++) {
			pages.push(
				<button
					key={i}
					onClick={() => handlePageChange(i)}
					className={`px-4 py-2 rounded-lg font-medium ${
						currentPage === i
							? 'bg-orange-600 text-white'
							: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
					}`}
				>
					{i}
				</button>
			)
		}

		// Last page
		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				pages.push(
					<span key="ellipsis2" className="px-2 text-gray-500">
						...
					</span>
				)
			}
			pages.push(
				<button
					key={totalPages}
					onClick={() => handlePageChange(totalPages)}
					className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
				>
					{totalPages}
				</button>
			)
		}

		// Next button
		pages.push(
			<button
				key="next"
				onClick={() => handlePageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				className={`px-3 py-2 rounded-lg font-medium ${
					currentPage === totalPages
						? 'bg-gray-100 text-gray-400 cursor-not-allowed'
						: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
				}`}
			>
				Siguiente
			</button>
		)

		return (
			<div className="flex items-center justify-center gap-2 mt-8">
				{pages}
			</div>
		)
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
				<p className="ml-2 text-gray-600">Cargando empleos...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-4 bg-red-50 border border-red-200 rounded-md">
				<p className="text-red-600">{error}</p>
			</div>
		)
	}

	if (!loading && allJobs.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="text-gray-400 text-6xl mb-4">💼</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">No hay empleos disponibles</h3>
				<p className="text-gray-500">Vuelve pronto para ver nuevas oportunidades.</p>
			</div>
		)
	}

	return (
		<div>
			{/* Total Count Highlight */}
			{showTotalCount && allJobs.length > 0 && (
				<div className="mb-8 text-center">
					<div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl shadow-lg">
						<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						<div className="text-left">
							<div className="text-3xl font-bold">{allJobs.length}</div>
							<div className="text-sm font-medium opacity-90">Posiciones Abiertas</div>
						</div>
					</div>
				</div>
			)}

			{/* Jobs List */}
			<div className="space-y-3">
				{currentJobs.map(job => (
					<div
						key={job.jobId}
						className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all duration-200"
					>
						<div className="flex justify-between items-center gap-4">
							<div className="flex-1 min-w-0">
								<div className="flex items-start gap-3 mb-2">
									<div className="flex-1 min-w-0">
										<h3 className="text-lg font-semibold text-gray-900 truncate">
											{job.jobTitle}
										</h3>
										<div className="flex items-center gap-2 text-sm mt-1">
											<span className="text-gray-600 font-medium">
												{job.companyName || 'Empresa'}
											</span>
											<span className="text-gray-400">•</span>
											<span className="text-gray-500 text-sm">
												{job.location || 'Ubicación no especificada'}
											</span>
										</div>
									</div>
									{job.postedDate && (
										<span className="text-xs text-gray-500 whitespace-nowrap">
											{new Date(job.postedDate).toLocaleDateString('es-MX', {
												month: 'short',
												day: 'numeric'
											})}
										</span>
									)}
								</div>

								<div className="flex items-center gap-2 flex-wrap">
									{job.jobType && (
										<span className="inline-block px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
											{job.jobType === 'full-time' && 'Tiempo Completo'}
											{job.jobType === 'part-time' && 'Medio Tiempo'}
											{job.jobType === 'contract' && 'Contrato'}
											{job.jobType === 'internship' && 'Prácticas'}
											{!['full-time', 'part-time', 'contract', 'internship'].includes(job.jobType) && job.jobType}
										</span>
									)}
									{job.salaryMin && job.salaryMax && !job.isSalaryHidden && (
										<span className="text-xs text-green-600 font-medium">
											${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
										</span>
									)}
								</div>
							</div>

							<div className="flex-shrink-0">
								<Link
									href="/signin"
									className="inline-block px-5 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
								>
									Inicia sesión para aplicar
								</Link>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Pagination */}
			{renderPagination()}

			{/* Results Info */}
			{allJobs.length > 0 && (
				<div className="text-center mt-6 text-sm text-gray-600">
					Mostrando {startIndex + 1}-{Math.min(endIndex, allJobs.length)} de {allJobs.length} empleos
				</div>
			)}
		</div>
	)
}

export default PublicJobListings

