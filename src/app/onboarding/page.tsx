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
					setError('Error al cargar las preferencias del usuario')
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
			setError('Por favor selecciona un tipo de cuenta.')
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
			setError('Debes iniciar sesión para continuar.')
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
					<p className="mt-2 text-gray-600">Cargando tus preferencias...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
			<div className="w-full max-w-lg p-6 sm:p-8 space-y-6 sm:space-y-8 bg-white rounded-lg shadow-md">
				<h2 className="text-xl sm:text-2xl font-bold text-center">
					Elige tu Tipo de Cuenta
				</h2>
				<div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
					<div
						onClick={() => handleSelection('personal')}
						className={`p-4 sm:p-6 border rounded-lg cursor-pointer text-center transition-all ${
							accountType === 'personal'
								? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500'
								: 'border-gray-300 hover:border-pink-300'
						}`}
					>
						<div className="text-4xl mb-3">👤</div>
						<h3 className="text-base sm:text-lg font-semibold text-gray-900">Personal</h3>
						<p className="text-xs sm:text-sm text-gray-600 mt-2">
							Encuentra empleos y construye tu carrera.
						</p>
					</div>
					<div
						onClick={() => handleSelection('enterprise')}
						className={`p-4 sm:p-6 border rounded-lg cursor-pointer text-center transition-all ${
							accountType === 'enterprise'
								? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500'
								: 'border-gray-300 hover:border-pink-300'
						}`}
					>
						<div className="text-4xl mb-3">🏢</div>
						<h3 className="text-base sm:text-lg font-semibold text-gray-900">Empresa</h3>
						<p className="text-xs sm:text-sm text-gray-600 mt-2">
							Contrata talento y gestiona tu empresa.
						</p>
					</div>
				</div>
				{error && <p className="text-xs sm:text-sm text-red-600 text-center">{error}</p>}
				<div>
					<button
						onClick={handleContinue}
						disabled={!accountType || loading}
						className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
					>
						{loading ? 'Guardando...' : 'Continuar'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default OnboardingPage