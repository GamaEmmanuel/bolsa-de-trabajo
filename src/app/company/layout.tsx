'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { auth, db } from '../../lib/firebase'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const CompanyLayout = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter()
	const pathname = usePathname()
	const [loading, setLoading] = useState(true)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	// Check if user has completed company setup (except for setup page itself)
	useEffect(() => {
		const checkSetupStatus = async () => {
			// Skip check if we're on the setup page or public company jobs page
			if (pathname === '/company/setup' || pathname?.match(/^\/company\/[^/]+\/jobs$/)) {
				setLoading(false)
				return
			}

			const user = auth.currentUser
			if (user) {
				try {
					const userRef = doc(db, 'users', user.uid)
					const userDoc = await getDoc(userRef)

					if (userDoc.exists()) {
						const userData = userDoc.data()
						if (!userData.companySetupCompleted) {
							// User hasn't completed setup, redirect to setup page
							router.push('/company/setup')
							return
						}
					} else {
						// User document doesn't exist, redirect to setup
						router.push('/company/setup')
						return
					}
				} catch (error) {
					console.error('Error checking setup status:', error)
				}
			} else {
				// No authenticated user, redirect to signin
				router.push('/signin')
				return
			}
			setLoading(false)
		}

		checkSetupStatus()
	}, [router, pathname])

	const handleSignOut = async () => {
		try {
			await signOut(auth)
			router.push('/')
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	const navigation = [
		{ name: 'Publicaciones', href: '/company/job-postings', icon: '📝' },
		{ name: 'Candidatos', href: '/company/ats', icon: '👥' },
		{ name: 'Búsqueda', href: '/company/talent-search', icon: '🔍' },
		{ name: 'Mensajes', href: '/company/inbox', icon: '💬' },
		{ name: 'Suscripción', href: '/company/credits', icon: '💳' },
		{ name: 'Configuración', href: '/company/settings', icon: '⚙️' },
	]

	const isActive = (href: string) => {
		if (href === '/company/job-postings') {
			return pathname.startsWith('/company/job-postings')
		}
		if (href === '/company/credits') {
			return pathname === '/company/credits' || pathname === '/company/checkout'
		}
		return pathname === href
	}

	// Show loading state while checking setup status
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<p className="mt-2 text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	// Check if this is a public company jobs page
	const isPublicJobsPage = pathname?.match(/^\/company\/[^/]+\/jobs$/)

	// If it's the public jobs page, render without the company navigation
	if (isPublicJobsPage) {
		return <>{children}</>
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						{/* Logo */}
						<div className="flex items-center">
							<Link href="/company/dashboard" className="flex items-center">
								<div className="w-10 h-10 bg-orange-500 rounded-full mr-3 flex items-center justify-center">
									<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
										<path d="M13 2L3 14h6v8l10-12h-6V2z"/>
									</svg>
								</div>
								<div className="flex flex-col">
									<span className="text-xl font-bold text-gray-900">TalentFlow</span>
									<span className="text-xs text-orange-500 font-semibold uppercase tracking-wide">CONTRATA, MÁS RÁPIDO</span>
								</div>
							</Link>
						</div>

						{/* Desktop Navigation */}
						<nav className="hidden md:flex space-x-8">
							{navigation.map((item) => (
								<Link
									key={item.name}
									href={item.href}
									className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive(item.href)
											? 'bg-blue-100 text-blue-700'
											: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
									}`}
								>
									<span className="mr-2">{item.icon}</span>
									{item.name}
								</Link>
							))}
						</nav>

						{/* User Menu */}
						<div className="flex items-center space-x-4">
							{/* Sign Out Button */}
							<button
								onClick={handleSignOut}
								className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
							>
								Sign Out
							</button>

							{/* Mobile menu button */}
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="md:hidden p-2 text-gray-400 hover:text-gray-600"
							>
								<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
						</div>
					</div>
				</div>

				{/* Mobile Navigation */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t border-gray-200 bg-white">
						<div className="px-2 pt-2 pb-3 space-y-1">
							{navigation.map((item) => (
								<Link
									key={item.name}
									href={item.href}
									className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
										isActive(item.href)
											? 'bg-blue-100 text-blue-700'
											: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
									}`}
									onClick={() => setIsMobileMenuOpen(false)}
								>
									<span className="mr-3">{item.icon}</span>
									{item.name}
								</Link>
							))}
						</div>
					</div>
				)}
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				{children}
			</main>
		</div>
	)
}

export default CompanyLayout
