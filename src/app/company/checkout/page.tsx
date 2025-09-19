'use client'

import React, { useState, Suspense } from 'react'
import {
	Elements,
	CardElement,
	useStripe,
	useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { JobTier } from '../../../../types'
import { useSearchParams } from 'next/navigation'

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

const tierPrices: Record<JobTier, number> = {
	clasica: 99,
	destacada: 199,
	premium: 299,
}

const CheckoutForm = ({ selectedTier }: { selectedTier: JobTier }) => {
	const stripe = useStripe()
	const elements = useElements()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [companyInfo, setCompanyInfo] = useState({
		razonSocial: '',
		rfc: '',
	})

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		if (!stripe || !elements) return

		setLoading(true)
		setError(null)

		// In a real app, you would create a PaymentIntent on your server
		// and use the client secret to confirm the payment on the client.
		console.log('Processing payment for:', {
			tier: selectedTier,
			amount: tierPrices[selectedTier],
			companyInfo,
		})

		// For demonstration, we'll simulate a successful payment
		setTimeout(() => {
			setLoading(false)
			alert('Payment successful! Your job posting is now live.')
			// Redirect to the dashboard or a confirmation page
			window.location.href = '/company/dashboard'
		}, 2000)
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-2">Company Information (for CFDI)</h3>
				<input
					type="text"
					placeholder="Razón Social"
					required
					className="w-full px-3 py-2 mb-2 border rounded-md"
					onChange={e => setCompanyInfo({ ...companyInfo, razonSocial: e.target.value })}
				/>
				<input
					type="text"
					placeholder="RFC"
					required
					className="w-full px-3 py-2 border rounded-md"
					onChange={e => setCompanyInfo({ ...companyInfo, rfc: e.target.value })}
				/>
			</div>

			<div className="mb-6">
				<h3 className="text-lg font-semibold mb-2">Payment Details</h3>
				<div className="p-3 border rounded-md">
					<CardElement />
				</div>
			</div>

			{error && <p className="text-red-500 text-sm mb-4">{error}</p>}

			<button
				type="submit"
				disabled={!stripe || loading}
				className="w-full px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
			>
				{loading ? 'Processing...' : `Pay $${tierPrices[selectedTier]} MXN`}
			</button>
		</form>
	)
}

const CheckoutPageContent = () => {
	const searchParams = useSearchParams()
	const tier = searchParams.get('tier') as JobTier | null

	if (!tier || !tierPrices[tier]) {
		return (
			<div className="text-center">
				<p className="text-red-500">Invalid job tier selected.</p>
			</div>
		)
	}

	return (
		<>
			<h2 className="text-2xl font-bold mb-2 text-center">Checkout</h2>
			<p className="text-center text-gray-600 mb-6">
				You have selected the{' '}
				<span className="font-semibold capitalize">{tier}</span> tier.
			</p>
			<Elements stripe={stripePromise}>
				<CheckoutForm selectedTier={tier} />
			</Elements>
		</>
	)
}

const CheckoutPage = () => {
	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
				<Suspense fallback={<div>Loading...</div>}>
					<CheckoutPageContent />
				</Suspense>
			</div>
		</div>
	)
}

export default CheckoutPage