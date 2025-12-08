'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const Header = () => {
	const [user, setUser] = useState(auth.currentUser)
	const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
	const [userName, setUserName] = useState<string>('')
	const [imageLoadError, setImageLoadError] = useState(false)

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
			<div className="max-w-6xl mx-auto px-6">
				<div className="flex justify-between items-center py-4">
					<div className="flex items-center">
						<Link href="/" className="flex items-center">
							<img
								src="/logo.png"
								alt="Meserea Logo"
								className="h-12 w-auto"
							/>
						</Link>
					</div>
					<div className="hidden md:flex items-center space-x-8">
						<Link href="/jobs" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
							Empleos
						</Link>
						<Link href="/contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
							Contacto
						</Link>
					</div>
					<div className="flex items-center space-x-3">
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
				</div>
			</div>
		</nav>
	)
}

export default Header
