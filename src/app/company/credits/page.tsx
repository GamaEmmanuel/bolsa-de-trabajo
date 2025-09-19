'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

const creditPackages = [
	{ id: 'pkg-1', name: '5 Credits', price: 50 },
	{ id: 'pkg-2', name: '10 Credits', price: 90 },
	{ id: 'pkg-3', name: '20 Credits', price: 160 },
]

const PurchaseCreditsPage = () => {
	const [selectedPackage, setSelectedPackage] = useState(creditPackages[1])
	const router = useRouter()

	const handlePurchase = () => {
		console.log('Proceeding to purchase:', selectedPackage)
		// Redirect to a checkout page, passing the package ID
		router.push(`/company/checkout?packageId=${selectedPackage.id}`)
	}

	return (
		<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-2">
						Pricing
					</h1>
					<p className="text-muted-foreground">
						Purchase contact credits to unlock candidate information and connect with top talent
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{creditPackages.map(pkg => (
						<div
							key={pkg.id}
							onClick={() => setSelectedPackage(pkg)}
							className={`p-6 border rounded-lg cursor-pointer text-center transition-colors ${
								selectedPackage.id === pkg.id
									? 'border-primary bg-primary/10'
									: 'border-border hover:border-primary/50'
							}`}
						>
							<h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
							<p className="text-2xl font-semibold my-4 text-foreground">${pkg.price} MXN</p>
							<p className="text-muted-foreground">
								${(pkg.price / parseInt(pkg.name)).toFixed(2)} per credit
							</p>
						</div>
					))}
				</div>

				<div className="text-center mt-8">
					<button
						onClick={handlePurchase}
						className="px-8 py-3 text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors text-lg font-semibold"
					>
						Purchase {selectedPackage.name}
					</button>
				</div>
			</div>
		</div>
	)
}

export default PurchaseCreditsPage