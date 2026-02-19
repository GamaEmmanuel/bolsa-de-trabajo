'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscriptionCheckoutRedirect() {
	const router = useRouter()

	useEffect(() => {
		router.replace('/company/job-postings/new')
	}, [router])

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-center">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
				<p className="mt-4 text-gray-600">Redirigiendo...</p>
			</div>
		</div>
	)
}
