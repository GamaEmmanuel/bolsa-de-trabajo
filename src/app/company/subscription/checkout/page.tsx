'use client'

import React, { useState, Suspense } from 'react'
import {
	Elements,
	CardElement,
	useStripe,
	useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useSearchParams } from 'next/navigation'

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

const subscriptionPlans = {
	startup: {
		name: 'Startup',
		price: '$99',
		amount: 9900,
		description: 'Perfecto para empresas en crecimiento'
	},
	professional: {
		name: 'Professional',
		price: '$299',
		amount: 29900,
		description: 'Para empresas establecidas'
	},
	enterprise: {
		name: 'Enterprise',
		price: 'Personalizado',
		amount: 0,
		description: 'Soluciones a medida para grandes organizaciones'
	}
}

const CheckoutForm = ({ selectedPlan }: { selectedPlan: keyof typeof subscriptionPlans }) => {
	const stripe = useStripe()
	const elements = useElements()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [companyInfo, setCompanyInfo] = useState({
		razonSocial: '',
		rfc: '',
		email: '',
	})

	const plan = subscriptionPlans[selectedPlan]

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		if (!stripe || !elements) return

		setLoading(true)
		setError(null)

		// In a real app, you would create a PaymentIntent on your server
		// and use the client secret to confirm the payment on the client.
		console.log('Processing subscription payment for:', {
			plan: selectedPlan,
			amount: plan.amount,
			companyInfo,
		})

		// For demonstration, we'll simulate a successful payment
		setTimeout(() => {
			setLoading(false)
			alert(`¡Suscripción exitosa! Tu plan ${plan.name} está ahora activo.`)
			// Redirect to the dashboard or a confirmation page
			window.location.href = '/company/dashboard'
		}, 2000)
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-4">Información de la Empresa</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<input
						type="text"
						placeholder="Razón Social"
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						onChange={e => setCompanyInfo({ ...companyInfo, razonSocial: e.target.value })}
					/>
					<input
						type="text"
						placeholder="RFC"
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						onChange={e => setCompanyInfo({ ...companyInfo, rfc: e.target.value })}
					/>
					<input
						type="email"
						placeholder="Email de contacto"
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						onChange={e => setCompanyInfo({ ...companyInfo, email: e.target.value })}
					/>
				</div>
			</div>

			{plan.amount > 0 && (
				<div className="mb-6">
					<h3 className="text-lg font-semibold mb-4">Información de Pago</h3>
					<div className="p-4 border border-gray-300 rounded-md bg-gray-50">
						<CardElement
							options={{
								style: {
									base: {
										fontSize: '16px',
										color: '#424770',
										'::placeholder': {
											color: '#aab7c4',
										},
									},
								},
							}}
						/>
					</div>
				</div>
			)}

			{error && <p className="text-red-500 text-sm mb-4">{error}</p>}

			<button
				type="submit"
				disabled={!stripe || loading}
				className="w-full px-6 py-3 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors font-semibold"
			>
				{loading ? 'Procesando...' : `Suscribirse al Plan ${plan.name} - ${plan.price}/mes`}
			</button>
		</form>
	)
}

const CheckoutPageContent = () => {
	const searchParams = useSearchParams()
	const plan = searchParams.get('plan') as keyof typeof subscriptionPlans

	if (!plan || !subscriptionPlans[plan]) {
		return (
			<div className="text-center">
				<p className="text-red-500">Plan de suscripción inválido.</p>
				<a href="/company/credits" className="text-orange-600 hover:underline">
					Volver a los planes
				</a>
			</div>
		)
	}

	const selectedPlan = subscriptionPlans[plan]

	return (
		<>
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold mb-2">Finalizar Suscripción</h2>
				<p className="text-gray-600 mb-6">
					Has seleccionado el plan <span className="font-semibold text-orange-600">{selectedPlan.name}</span>
				</p>

				{/* Plan Summary */}
				<div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
					<h3 className="text-xl font-semibold text-orange-900 mb-2">{selectedPlan.name}</h3>
					<p className="text-orange-700 mb-4">{selectedPlan.description}</p>
					<div className="text-3xl font-bold text-orange-600">
						{selectedPlan.price}
						{selectedPlan.amount > 0 && <span className="text-lg text-gray-500">/mes</span>}
					</div>
				</div>
			</div>

			{selectedPlan.amount > 0 ? (
				<Elements stripe={stripePromise}>
					<CheckoutForm selectedPlan={plan} />
				</Elements>
			) : (
				<div className="text-center">
					<p className="text-gray-600 mb-6">
						Para el plan Enterprise, nuestro equipo de ventas se pondrá en contacto contigo.
					</p>
					<a
						href="/contact"
						className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
					>
						Contactar Ventas
					</a>
				</div>
			)}
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

