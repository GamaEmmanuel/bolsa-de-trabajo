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

	// Check if user has completed company setup (except for setup page itself)
	useEffect(() => {
		const checkSetupStatus = async () => {
			// Skip check if we're on the setup page
			if (pathname === '/company/setup') {
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
			router.push('/signin')
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	const navigationItems = [
		{
			href: '/company/dashboard',
			label: 'Inicio',
			isActive: pathname === '/company/dashboard'
		},
		{
			href: '/company/job-postings',
			label: 'Publicaciones de Empleo',
			isActive: pathname.startsWith('/company/job-postings')
		},
		{
			href: '/company/ats',
			label: 'Candidatos',
			isActive: pathname === '/company/ats'
		},
		{
			href: '/company/talent-search',
			label: 'Búsqueda de Talento',
			isActive: pathname === '/company/talent-search'
		},
		{
			href: '/company/credits',
			label: 'Suscripción',
			isActive: pathname === '/company/credits' || pathname === '/company/checkout'
		},
		{
			href: '/company/settings',
			label: 'Configuración',
			isActive: pathname === '/company/settings'
		}
	]

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

	return (
		<div className="min-h-screen bg-secondary">
			<header className="bg-card border-b border-border">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						{/* Logo/Brand */}
						<Link href="/company/dashboard" className="flex items-center">
							<div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3 flex items-center justify-center">
								<span className="text-white font-bold text-sm">T</span>
							</div>
							<span className="text-xl font-bold text-foreground">TalentFlow</span>
						</Link>

						{/* Navigation */}
						<nav className="hidden md:flex items-center space-x-8">
							{navigationItems.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={`font-medium transition-colors ${
										item.isActive
											? 'text-primary border-b-2 border-primary pb-1'
											: 'text-muted-foreground hover:text-foreground'
									}`}
								>
									{item.label}
								</Link>
							))}
						</nav>

						{/* User Actions */}
						<div className="flex items-center space-x-4">
							<button
								onClick={handleSignOut}
								className="px-4 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
							>
								Sign Out
							</button>
						</div>
					</div>

					{/* Mobile Navigation */}
					<div className="md:hidden pb-4">
						<nav className="flex flex-wrap gap-4">
							{navigationItems.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										item.isActive
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:text-foreground hover:bg-accent'
									}`}
								>
									{item.label}
								</Link>
							))}
						</nav>
					</div>
				</div>
			</header>
			<main>{children}</main>
		</div>
	)
}

export default CompanyLayout
