'use client'

import React from 'react'
import Header from '../../components/Header'
import FullPricingSection from '../../components/FullPricingSection'

const PricingPage = () => {
	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<div className="pt-16 sm:pt-20 md:pt-24 px-4 sm:px-0">
				<FullPricingSection />
			</div>
		</div>
	)
}

export default PricingPage
