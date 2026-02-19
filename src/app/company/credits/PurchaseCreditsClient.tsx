'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { app } from '@/lib/firebase'
import Link from 'next/link'

const db = getFirestore(app)

const PurchaseCreditsClient = () => {
	const { user } = useAuth()
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [payments, setPayments] = useState<any[]>([])
	const [companyName, setCompanyName] = useState('')

	useEffect(() => {
		async function loadPaymentHistory() {
			if (!user) {
				setLoading(false)
				return
			}

			try {
				const userRef = doc(db, 'users', user.uid)
				const userDoc = await getDoc(userRef)

				if (userDoc.exists()) {
					const userData = userDoc.data()
					const companyId = userData.companyId

					if (companyId) {
						const companyRef = doc(db, 'companies', companyId)
						const companyDoc = await getDoc(companyRef)
						if (companyDoc.exists()) {
							setCompanyName(companyDoc.data()?.companyName || '')
						}

						const paymentsQuery = query(
							collection(db, 'payments'),
							where('companyId', '==', companyId),
							orderBy('createdAt', 'desc'),
							limit(20)
						)
						const paymentsSnap = await getDocs(paymentsQuery)
						const paymentsList = paymentsSnap.docs.map(d => ({
							id: d.id,
							...d.data()
						}))
						setPayments(paymentsList)
					}
				}
			} catch (err) {
				console.error('Error loading payment history:', err)
			} finally {
				setLoading(false)
			}
		}

		loadPaymentHistory()
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

	return (
		<div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<h1 className="text-2xl font-bold text-gray-900 mb-6">Pagos</h1>

			{/* Payment Model Info */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
				<div className="flex items-start gap-4">
					<div className="flex-shrink-0 w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
						<svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
					<div>
						<h2 className="text-lg font-semibold text-gray-900">Pago por publicación</h2>
						<p className="text-gray-600 mt-1">
							Paga <strong className="text-pink-600">$10 MXN</strong> por cada vacante que publiques. Sin suscripciones, sin cargos recurrentes. Crea borradores gratis y solo paga al publicar.
						</p>
						<Link
							href="/company/job-postings/new"
							className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm"
						>
							Publicar Empleo
						</Link>
					</div>
				</div>
			</div>

			{/* Payment History */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">Historial de Pagos</h2>
				</div>

				{payments.length === 0 ? (
					<div className="p-8 text-center text-gray-500">
						<svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
						</svg>
						<p>Aún no tienes pagos registrados.</p>
						<p className="text-sm mt-1">Tus pagos aparecerán aquí cuando publiques una vacante.</p>
					</div>
				) : (
					<div className="divide-y divide-gray-100">
						{payments.map((payment) => (
							<div key={payment.id} className="px-6 py-4 flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-900">
										Publicación de empleo
									</p>
									<p className="text-xs text-gray-500 mt-0.5">
										{payment.createdAt?.toDate
											? payment.createdAt.toDate().toLocaleDateString('es-MX', {
												year: 'numeric',
												month: 'long',
												day: 'numeric'
											})
											: 'Fecha no disponible'
										}
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm font-semibold text-gray-900">
										${payment.amount ? (payment.amount / 100).toFixed(2) : '10.00'} {payment.currency?.toUpperCase() || 'MXN'}
									</p>
									<span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
										payment.status === 'paid'
											? 'bg-green-100 text-green-700'
											: 'bg-yellow-100 text-yellow-700'
									}`}>
										{payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
									</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default PurchaseCreditsClient