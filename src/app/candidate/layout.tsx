'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '../../lib/firebase'
import { signOut } from 'firebase/auth'

const CandidateLayout = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname()
	const router = useRouter()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const handleSignOut = async () => {
		try {
			await signOut(auth)
			router.push('/signin')
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	const navigation = [
		{ name: 'Empleos', href: '/candidate/jobs', icon: '🔍' },
		{ name: 'Aplicaciones', href: '/candidate/my-applications', icon: '📋' },
		{ name: 'Currículum', href: '/candidate/resume', icon: '📄' },
		{ name: 'Cuenta', href: '/candidate/account', icon: '👤' },
	]

	const isActive = (href: string) => pathname === href

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						{/* Logo */}
						<div className="flex items-center">
							<Link href="/candidate/dashboard" className="flex items-center">
								<div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3 flex items-center justify-center">
									<span className="text-white font-bold text-sm">T</span>
								</div>
								<span className="text-xl font-bold text-gray-900">TalentFlow</span>
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
							{/* Profile Dropdown */}
							<div className="relative">
								<button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
									<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
										<span className="text-white font-medium text-sm">U</span>
									</div>
								</button>
							</div>

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

export default CandidateLayout
