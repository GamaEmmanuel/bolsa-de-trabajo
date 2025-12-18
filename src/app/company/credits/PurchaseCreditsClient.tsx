'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { app } from '@/lib/firebase'
import FullPricingSection from '../../../components/FullPricingSection'

const db = getFirestore(app)

const PurchaseCreditsClient = () => {
	const { user } = useAuth()
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
	const [companyData, setCompanyData] = useState<any>(null)

	useEffect(() => {
		async function checkSubscriptionStatus() {
			if (!user) {
				setLoading(false)
				return
			}

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
							const data = companyDoc.data()
							setCompanyData({
								companyId,
								...data
							})

							// Check if subscription is active or trialing
							if (data?.subscription?.status === 'active' || data?.subscription?.status === 'trialing') {
								setHasActiveSubscription(true)
							}
						}
					}
				}
			} catch (err) {
				console.error('Error checking subscription status:', err)
			} finally {
				setLoading(false)
			}
		}

		checkSubscriptionStatus()
	}, [user])

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
						<p className="mt-2 text-gray-600">Cargando...</p>
					</div>
				</div>
			</div>
		)
	}

	if (hasActiveSubscription) {
		return (
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="max-w-2xl mx-auto text-center">
					<div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border-2 border-green-200">
						<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
							<svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>

						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							¡Ya Tienes una Suscripción Activa!
						</h2>

						<p className="text-lg text-gray-600 mb-8">
							Tu empresa <strong className="text-gray-900">{companyData?.companyName || 'ya'}</strong> cuenta con una suscripción activa al plan Empresa.
						</p>

						<div className="bg-green-50 rounded-lg p-6 mb-8 border border-green-200">
							<p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-2">
								Tu Plan Actual
							</p>
							<p className="text-2xl font-bold text-green-700 mb-3">
								Plan Empresa
							</p>
							<ul className="text-left space-y-2 text-sm text-gray-600">
								<li className="flex items-center">
									<svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									Publicaciones ilimitadas
								</li>
								<li className="flex items-center">
									<svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									ATS avanzado
								</li>
								<li className="flex items-center">
									<svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									Dashboard de análisis
								</li>
								<li className="flex items-center">
									<svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									Soporte prioritario
								</li>
							</ul>
							{companyData?.subscription?.currentPeriodEnd && (
								<p className="text-sm text-gray-500 mt-4 pt-4 border-t border-green-200">
									Próxima facturación: {new Date(companyData.subscription.currentPeriodEnd.seconds * 1000).toLocaleDateString('es-MX', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</p>
							)}
						</div>

						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<button
								onClick={() => router.push('/company/dashboard')}
								className="px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-semibold text-base"
							>
								Ir al Dashboard
							</button>
							<button
								onClick={() => router.push('/company/subscription/checkout?plan=startup')}
								className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-base flex items-center justify-center gap-2"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								Gestionar Suscripción
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<FullPricingSection
				title="Suscripción"
				subtitle="Comienza gratis y escala mientras creces. Sin tarifas ocultas, sin sorpresas."
			/>
		</div>
	)
}

export default PurchaseCreditsClient