'use client'

import React, { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { useStripeCheckout } from '@/lib/useStripeCheckout'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
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
	const { createCheckoutSession, loading, error } = useStripeCheckout()
	const [companyData, setCompanyData] = useState<any>(null)
	const [loadingCompany, setLoadingCompany] = useState(true)

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

	return (
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
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold mb-2">Finalizar Suscripción</h2>
				<p className="text-gray-600 mb-6">
					Plan <span className="font-semibold text-pink-600">{selectedPlan.name}</span>
				</p>

				{/* Plan Summary */}
				<div className="bg-pink-50 border border-pink-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
					<h3 className="text-xl font-semibold text-pink-900 mb-2">{selectedPlan.name}</h3>
					<p className="text-pink-700 mb-4">{selectedPlan.description}</p>
					<div className="text-3xl font-bold text-pink-600">
						{selectedPlan.price}
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

