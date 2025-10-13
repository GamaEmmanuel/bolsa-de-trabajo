'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import FullPricingSection from '../../../components/FullPricingSection'

const creditPackages = [
	{ id: 'pkg-1', name: '5 Credits', price: 50 },
	{ id: 'pkg-2', name: '10 Credits', price: 90 },
	{ id: 'pkg-3', name: '20 Credits', price: 160 },
]

const PurchaseCreditsPage = () => {
	return (
		<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<FullPricingSection
				title="Suscripción"
				subtitle="Comienza gratis y escala mientras creces. Sin tarifas ocultas, sin sorpresas."
			/>
		</div>
	)
}

export default PurchaseCreditsPage