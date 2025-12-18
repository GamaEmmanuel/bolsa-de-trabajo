'use client'

import React, { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { useStripeCheckout } from '@/lib/useStripeCheckout'
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { app } from '@/lib/firebase'

const db = getFirestore(app)

const subscriptionPlans = {
	startup: {
		name: 'Empresa',
		price: '$100 mx',
		amount: 10000,
		description: 'Perfecto para empresas en crecimiento'
	}
}

const CheckoutForm = ({ selectedPlan }: { selectedPlan: keyof typeof subscriptionPlans }) => {
	const { user } = useAuth()
	const { createCheckoutSession, createPortalSession, loading, error } = useStripeCheckout()
	const [companyData, setCompanyData] = useState<any>(null)
	const [loadingCompany, setLoadingCompany] = useState(true)

	const [loadingPortal, setLoadingPortal] = useState(false)

	const plan = subscriptionPlans[selectedPlan]

	useEffect(() => {
		async function loadCompanyData() {
			if (!user) return

			try {
				// Get user document to find companyId
				const userRef = doc(db, 'users', user.uid)
				const userDoc = await getDoc(userRef)

				if (userDoc.exists()) {
					const userData = userDoc.data()
					const companyId = userData.companyId

					if (companyId) {
						// Get company document
						const companyRef = doc(db, 'companies', companyId)
						const companyDoc = await getDoc(companyRef)

						if (companyDoc.exists()) {
							setCompanyData({
								companyId,
								...companyDoc.data()
							})
						}
					} else if (userData.companyData) {
						// FALLBACK: Handle legacy/broken state where company data exists on user but no companyId
						console.log('Found company data on user but no companyId. Attempting to repair...')

						// Try to find if there is already a companyId in the nested data or use user UID
						const existingCompanyId = userData.companyData.companyId
						const newCompanyId = existingCompanyId || user.uid

						console.log(`Repairing with companyId: ${newCompanyId} (Found in data: ${!!existingCompanyId})`)

						const companyDataToSave = {
							...userData.companyData,
							companyId: newCompanyId,
							createdAt: userData.companyData.createdAt || new Date().toISOString(),
						}

						// 1. Create/Update company document
						try {
							// If we are recovering an existing ID, we should check if that doc exists and has more info (like subscription)
							if (existingCompanyId) {
								const existingDoc = await getDoc(doc(db, 'companies', existingCompanyId))
								if (existingDoc.exists()) {
									// Merge with existing data, preferring existing data for critical fields like subscription
									const existingData = existingDoc.data()
									if (existingData.subscription) {
										companyDataToSave.subscription = existingData.subscription
									}
								}
							}

							await setDoc(doc(db, 'companies', newCompanyId), companyDataToSave, { merge: true })

							// 2. Link in user document
							await updateDoc(doc(db, 'users', user.uid), {
								companyId: newCompanyId
							})

							console.log('Repaired company data structure')

							setCompanyData(companyDataToSave)
						} catch (repairError) {
							console.error('Error repairing company data:', repairError)
							// Still set data so user can proceed, even if repair failed
							setCompanyData(companyDataToSave)
						}
					}
				}
			} catch (err) {
				console.error('Error loading company data:', err)
			} finally {
				setLoadingCompany(false)
			}
		}

		loadCompanyData()
	}, [user])

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()

		if (!user || !companyData) {
			alert('Error: No se pudo cargar la información de la empresa')
			return
		}

		// Create Stripe Checkout Session and redirect
		await createCheckoutSession({
			companyId: companyData.companyId,
			userId: user.uid,
			email: user.email || '',
			companyName: companyData.companyName || '',
			customerId: companyData.subscription?.stripeCustomerId
		})
	}

	const handlePortalAccess = async () => {
		if (!companyData?.companyId) return
		setLoadingPortal(true)
		try {
			await createPortalSession(companyData.companyId, companyData.subscription?.stripeCustomerId)
		} catch (err) {
			console.error('Error opening portal:', err)
		} finally {
			setLoadingPortal(false)
		}
	}

	if (loadingCompany) {
		return (
			<div className="text-center py-8">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
				<p className="mt-4 text-gray-600">Cargando información...</p>
			</div>
		)
	}

	if (!user) {
		return (
			<div className="text-center py-8">
				<p className="text-red-500 mb-4">Debes iniciar sesión para suscribirte</p>
				<a href="/signin" className="text-pink-600 hover:underline">
					Iniciar sesión
				</a>
			</div>
		)
	}

	if (!companyData) {
		return (
			<div className="text-center py-8">
				<p className="text-red-500 mb-4">No se encontró información de la empresa</p>
				<a href="/company/setup" className="text-pink-600 hover:underline">
					Configurar empresa
				</a>
			</div>
		)
	}

	if (companyData?.subscription?.status === 'active' || companyData?.subscription?.status === 'trialing') {
		return (
			<div className="text-center py-8">
				<div className="mb-6">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
						<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h3 className="text-2xl font-bold text-gray-900 mb-2">¡Suscripción Activa!</h3>
					<p className="text-gray-600 mb-6">
						Tu empresa <strong>{companyData.companyName}</strong> ya cuenta con una suscripción activa.
					</p>

					<div className="bg-green-50 rounded-lg p-6 max-w-md mx-auto mb-8 border border-green-200">
						<p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Plan Actual</p>
						<p className="text-xl font-bold text-green-700">{subscriptionPlans['startup'].name}</p>
						<p className="text-sm text-gray-600 mt-2">
							Próxima facturación: {companyData.subscription.currentPeriodEnd ? new Date(companyData.subscription.currentPeriodEnd.seconds * 1000).toLocaleDateString() : 'N/A'}
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							onClick={() => window.location.href = '/company/dashboard'}
							className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
						>
							Ir al Dashboard
						</button>
						<button
							onClick={handlePortalAccess}
							disabled={loadingPortal}
							className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2"
						>
							{loadingPortal ? (
								<div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
							) : (
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							)}
							Gestionar Suscripción
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<>
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold mb-2">Finalizar Suscripción</h2>
				<p className="text-gray-600 mb-6">
					Plan <span className="font-semibold text-pink-600">{plan.name}</span>
				</p>

				{/* Plan Summary */}
				<div className="bg-pink-50 border border-pink-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
					<h3 className="text-xl font-semibold text-pink-900 mb-2">{plan.name}</h3>
					<p className="text-pink-700 mb-4">{plan.description}</p>
					<div className="text-3xl font-bold text-pink-600">
						{plan.price}
						<span className="text-lg text-gray-500">/mes</span>
					</div>
					<div className="mt-4 text-sm text-gray-600">
						<p>✓ Publicaciones ilimitadas</p>
						<p>✓ 1000 créditos de IA mensuales</p>
						<p>✓ ATS avanzado</p>
						<p>✓ Soporte prioritario</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit}>
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-4">Información de la Empresa</h3>
					<div className="bg-gray-50 p-4 rounded-lg">
						<p className="text-gray-700"><strong>Empresa:</strong> {companyData.companyName}</p>
						<p className="text-gray-700"><strong>Email:</strong> {user.email}</p>
						{companyData.rfc && <p className="text-gray-700"><strong>RFC:</strong> {companyData.rfc}</p>}
					</div>
				</div>

				{error && (
					<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-red-700 font-semibold mb-2">Error</p>
						<p className="text-red-600 text-sm mb-2">{error}</p>
						{error.includes('Stripe is not configured') && (
							<div className="mt-3 text-xs text-red-600">
								<p className="font-semibold mb-1">Para el desarrollador:</p>
								<p>Asegúrate de agregar las variables de entorno de Stripe en tu archivo .env.local</p>
								<p className="mt-1">Consulta: <code className="bg-red-100 px-1 py-0.5 rounded">STRIPE_SETUP.md</code></p>
							</div>
						)}
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="w-full px-6 py-3 text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:bg-gray-400 transition-colors font-semibold"
				>
					{loading ? 'Redirigiendo a checkout...' : `Continuar al pago - ${plan.price}/mes`}
				</button>

				<p className="text-xs text-gray-500 text-center mt-4">
					Serás redirigido a Stripe para completar el pago de forma segura
				</p>
			</form>
		</>
	)
}

const CheckoutPageContent = () => {
	const searchParams = useSearchParams()
	const plan = searchParams.get('plan') as keyof typeof subscriptionPlans

	// Default to 'startup' if no plan specified
	const selectedPlanKey = (plan && subscriptionPlans[plan]) ? plan : 'startup'
	const selectedPlan = subscriptionPlans[selectedPlanKey]

	return (
		<>
			{/* Only show header and plan summary if NOT subscribed */}
			{/* We need to move this logic inside CheckoutForm or lift state up,
				but for now, we'll let CheckoutForm control the whole view when subscribed
				by hiding the header via CSS or conditional rendering if we could access state here.

				Since we can't easily access the state from here without refactoring,
				I will refactor CheckoutPageContent to move the header INSIDE CheckoutForm.
			*/}
			<CheckoutForm selectedPlan={selectedPlanKey} />
		</>
	)
}

const SubscriptionCheckoutPage = () => {
	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm">
				<Suspense fallback={<div className="text-center">Cargando...</div>}>
					<CheckoutPageContent />
				</Suspense>
			</div>
		</div>
	)
}

export default SubscriptionCheckoutPage

