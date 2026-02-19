'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const Header = () => {
	const [user, setUser] = useState(auth.currentUser)
	const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
	const [userName, setUserName] = useState<string>('')
	const [imageLoadError, setImageLoadError] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser)
			if (currentUser) {
				try {
					// Get user account data
					const accountRef = doc(db, 'userAccounts', currentUser.uid)
					const accountDoc = await getDoc(accountRef)

					if (accountDoc.exists()) {
						const accountData = accountDoc.data()
						setProfilePictureUrl(accountData.profilePictureUrl || currentUser.photoURL)
						setImageLoadError(false)
						setUserName(accountData.firstName && accountData.lastName
							? `${accountData.firstName} ${accountData.lastName}`
							: currentUser.displayName || 'User')
					} else {
						setProfilePictureUrl(currentUser.photoURL)
						setImageLoadError(false)
						setUserName(currentUser.displayName || 'User')
					}
				} catch (error) {
					console.error('Error fetching user data:', error)
					setProfilePictureUrl(currentUser.photoURL)
					setUserName(currentUser.displayName || 'User')
				}
			} else {
				setProfilePictureUrl(null)
				setUserName('')
			}
		})

		return () => unsubscribe()
	}, [])

	const handleSignOut = async () => {
		try {
			await auth.signOut()
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	return (
		<nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
			<div className="max-w-6xl mx-auto px-4 sm:px-6">
				<div className="flex justify-between items-center py-3 sm:py-4">
					<div className="flex items-center">
						<Link href="/" className="flex items-center">
							<Image
								src="/logo.png"
								alt="Trabajo Libre Logo"
								width={144}
								height={48}
								className="h-10 sm:h-12 w-auto"
								priority
							/>
						</Link>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-8">
						<Link href="/jobs" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
							Empleos
						</Link>
						<Link href="/contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
							Contacto
						</Link>
					</div>

					{/* Desktop User Menu */}
					<div className="hidden md:flex items-center space-x-3">
						{user ? (
							<div className="flex items-center space-x-3">
								<Link
									href="/candidate/dashboard"
									className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 transition-colors"
								>
									Dashboard
								</Link>
								<div className="flex items-center space-x-2">
									{profilePictureUrl && !imageLoadError ? (
										<img
											src={profilePictureUrl}
											alt={userName}
											className="w-8 h-8 rounded-full object-cover border border-gray-300"
											onError={() => {
												console.error('Failed to load profile picture:', profilePictureUrl)
												setImageLoadError(true)
											}}
											onLoad={() => {
												setImageLoadError(false)
											}}
										/>
									) : (
										<div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
											{userName.charAt(0).toUpperCase()}
										</div>
									)}
									<span className="text-sm text-gray-700 font-medium">{userName}</span>
								</div>
								<button
									onClick={handleSignOut}
									className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 transition-colors"
								>
									Sign Out
								</button>
							</div>
						) : (
							<>
								<Link
									href="/signin"
									className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 transition-colors"
								>
									Iniciar Sesión
								</Link>
								<Link
									href="/signup"
									className="px-5 py-2.5 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
								>
									Comenzar
								</Link>
							</>
						)}
					</div>

					{/* Mobile Menu Button */}
					<div className="md:hidden flex items-center">
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
							aria-label="Toggle menu"
						>
							{isMobileMenuOpen ? (
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							) : (
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							)}
						</button>
					</div>
				</div>

				{/* Mobile Menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t border-gray-200 py-4">
						<div className="flex flex-col space-y-4">
							{/* Navigation Links */}
							<Link
								href="/jobs"
								className="text-gray-700 hover:text-gray-900 font-medium px-2 py-2 transition-colors"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								Empleos
							</Link>
							<Link
								href="/contact"
								className="text-gray-700 hover:text-gray-900 font-medium px-2 py-2 transition-colors"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								Contacto
							</Link>

							{user ? (
								<>
									<Link
										href="/candidate/dashboard"
										className="text-gray-700 hover:text-gray-900 font-medium px-2 py-2 transition-colors"
										onClick={() => setIsMobileMenuOpen(false)}
									>
										Dashboard
									</Link>
									<div className="flex items-center space-x-2 px-2 py-2">
										{profilePictureUrl && !imageLoadError ? (
											<img
												src={profilePictureUrl}
												alt={userName}
												className="w-8 h-8 rounded-full object-cover border border-gray-300"
												onError={() => {
													console.error('Failed to load profile picture:', profilePictureUrl)
													setImageLoadError(true)
												}}
												onLoad={() => {
													setImageLoadError(false)
												}}
											/>
										) : (
											<div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
												{userName.charAt(0).toUpperCase()}
											</div>
										)}
										<span className="text-sm text-gray-700 font-medium">{userName}</span>
									</div>
									<button
										onClick={() => {
											handleSignOut()
											setIsMobileMenuOpen(false)
										}}
										className="text-left text-gray-700 hover:text-gray-900 font-medium px-2 py-2 transition-colors"
									>
										Sign Out
									</button>
								</>
							) : (
								<>
									<Link
										href="/signin"
										className="text-gray-700 hover:text-gray-900 font-medium px-2 py-2 transition-colors"
										onClick={() => setIsMobileMenuOpen(false)}
									>
										Iniciar Sesión
									</Link>
									<Link
										href="/signup"
										className="px-5 py-2.5 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors text-center"
										onClick={() => setIsMobileMenuOpen(false)}
									>
										Comenzar
									</Link>
								</>
							)}
						</div>
					</div>
				)}
			</div>
		</nav>
	)
}

export default Header
