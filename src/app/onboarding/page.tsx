'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '../../lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { getUserPreferences, getRedirectPath } from '../../lib/userPreferences'

type AccountType = 'personal' | 'enterprise'

const OnboardingPage = () => {
	const [accountType, setAccountType] = useState<AccountType | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [checkingPreferences, setCheckingPreferences] = useState(true)
	const router = useRouter()

	// Check if user already has preferences set
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				try {
					const preferences = await getUserPreferences(user.uid)

					if (preferences) {
						// User already has preferences, redirect to appropriate dashboard
						router.push(getRedirectPath(preferences))
						return
					}
					setCheckingPreferences(false)
					setLoading(false)
				} catch (error) {
					console.error('Error checking user preferences:', error)
					setError('Failed to load user preferences')
					setCheckingPreferences(false)
					setLoading(false)
				}
			} else {
				// User not authenticated, redirect to signin
				router.push('/signin')
			}
		})

		return () => unsubscribe()
	}, [router])

	const handleSelection = (type: AccountType) => {
		setAccountType(type)
	}

	const handleContinue = async () => {
		if (!accountType) {
			setError('Please select an account type.')
			return
		}

		setLoading(true)
		setError(null)

		const user = auth.currentUser
		if (user) {
			try {
				// Save the user's account type and role to the database
				const userRef = doc(db, 'users', user.uid)
				await setDoc(
					userRef,
					{
						uid: user.uid,
						accountType: accountType,
						role: accountType === 'personal' ? 'candidate' : 'recruiter',
						email: user.email,
						createdAt: new Date().toISOString(),
						lastLogin: new Date().toISOString(),
					},
					{ merge: true }
				)

				// Send welcome email (async, don't block)
				try {
					const userName = user.displayName || user.email?.split('@')[0] || 'Usuario'
					const dashboardLink = accountType === 'personal'
						? `${window.location.origin}/candidate/dashboard`
						: `${window.location.origin}/company/setup`

					fetch('/api/notifications/welcome', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							userId: user.uid,
							userEmail: user.email,
							userName,
							accountType,
							dashboardLink,
						}),
					}).catch(err => console.error('Error sending welcome email:', err))
				} catch (emailError) {
					console.error('Error sending welcome email:', emailError)
				}

				// Redirect to the appropriate dashboard or setup page
				const preferences = {
					accountType: accountType,
					role: accountType === 'personal' ? 'candidate' : 'recruiter'
				}
				router.push(getRedirectPath(preferences))
			} catch (error) {
				setError((error as Error).message)
				setLoading(false)
			}
		} else {
			// Handle the case where the user is not authenticated
			setError('You must be signed in to continue.')
			setLoading(false)
			router.push('/signin')
		}
	}

	// Show loading state while checking preferences
	if (checkingPreferences) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
					<p className="mt-2 text-gray-600">Loading your preferences...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50">
			<div className="w-full max-w-lg p-8 space-y-8 bg-white rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-center">
					Choose Your Account Type
				</h2>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div
						onClick={() => handleSelection('personal')}
						className={`p-6 border rounded-lg cursor-pointer text-center ${
							accountType === 'personal'
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-300'
						}`}
					>
						<h3 className="text-lg font-semibold">Personal</h3>
						<p className="text-sm text-gray-600">
							Find jobs and build your career.
						</p>
					</div>
					<div
						onClick={() => handleSelection('enterprise')}
						className={`p-6 border rounded-lg cursor-pointer text-center ${
							accountType === 'enterprise'
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-300'
						}`}
					>
						<h3 className="text-lg font-semibold">Enterprise</h3>
						<p className="text-sm text-gray-600">
							Hire talent and manage your company.
						</p>
					</div>
				</div>
				{error && <p className="text-sm text-red-600 text-center">{error}</p>}
				<div>
					<button
						onClick={handleContinue}
						disabled={!accountType || loading}
						className="w-full px-4 py-2 text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:bg-gray-400"
					>
						{loading ? 'Saving...' : 'Continue'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default OnboardingPage