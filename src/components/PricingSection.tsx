'use client'

import React from 'react'
import Link from 'next/link'

interface PricingPlan {
	name: string
	price: string
	period?: string
	description: string
	features: string[]
	ctaText: string
	ctaLink: string
	popular?: boolean
	buttonStyle?: 'primary' | 'secondary' | 'outline'
	planId?: string
	amount?: number
}

interface PricingSectionProps {
	title?: string
	subtitle?: string
	showViewAllPlans?: boolean
	viewAllPlansLink?: string
	className?: string
}

const PricingSection: React.FC<PricingSectionProps> = ({
	title = "Precios simples y transparentes",
	subtitle = "Comienza gratis y escala mientras creces. Sin tarifas ocultas, sin sorpresas.",
	showViewAllPlans = false,
	viewAllPlansLink = "/pricing",
	className = ""
}) => {
	const pricingPlans: PricingPlan[] = [
		{
			name: "Buscador de Empleo",
			price: "Gratis",
			description: "Perfecto para buscadores de empleo individuales",
			features: [
				"Aplicaciones ilimitadas de empleo",
				"Filtros de búsqueda avanzados",
				"Constructor de currículum",
				"Seguimiento de aplicaciones"
			],
			ctaText: "Comenzar Gratis",
			ctaLink: "/signup?type=candidate",
			buttonStyle: "primary",
			planId: "free",
			amount: 0
		},
		{
			name: "Empresa",
			price: "$300",
			period: "/mes",
			description: "Perfecto para empresas en crecimiento",
			features: [
				"Hasta 20 publicaciones de empleo activas",
				"ATS avanzado",
				"Evaluación y filtrado de currículums",
				"Notificaciones",
				"Dashboard de análisis",
				"Soporte",
				"Hasta 100 candidatos por publicación de empleo"
			],
			ctaText: "Suscribirse Ahora",
			ctaLink: "/company/subscription/checkout?plan=startup",
			popular: true,
			buttonStyle: "primary",
			planId: "startup",
			amount: 30000
		}
	]

	const getButtonClasses = (plan: PricingPlan) => {
		const baseClasses = "block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors"

		switch (plan.buttonStyle) {
			case 'primary':
				return `${baseClasses} bg-orange-600 text-white hover:bg-orange-700`
			case 'secondary':
				return `${baseClasses} bg-gray-900 text-white hover:bg-gray-800`
			case 'outline':
				return `${baseClasses} border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white`
			default:
				return `${baseClasses} bg-orange-600 text-white hover:bg-orange-700`
		}
	}

	return (
		<section className={`py-20 bg-white ${className}`}>
			<div className="max-w-6xl mx-auto px-6">
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
						{title}
					</h2>
					<p className="text-xl text-gray-600 max-w-3xl mx-auto">
						{subtitle}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
					{pricingPlans.map((plan, index) => (
						<div
							key={index}
							className={`bg-white rounded-2xl p-8 border-2 flex flex-col h-full ${
								plan.popular
									? 'border-orange-500 relative transform scale-105 shadow-lg'
									: 'border-gray-100 hover:border-orange-200'
							} transition-all duration-300`}
						>
							{plan.popular && (
								<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
									<span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
										Más Popular
									</span>
								</div>
							)}
							<div className="text-center mb-8">
								<h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
								<div className="mt-4">
									<span className={`font-bold text-gray-900 ${plan.price.length > 8 ? 'text-3xl' : 'text-4xl'}`}>{plan.price}</span>
									{plan.period && (
										<span className="text-gray-500">{plan.period}</span>
									)}
								</div>
								<p className="mt-2 text-gray-600 break-words">{plan.description}</p>
							</div>
							<ul className="space-y-4 mb-8 flex-grow">
								{plan.features.map((feature, featureIndex) => (
									<li key={featureIndex} className="flex items-start">
										<svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
										<span className="text-gray-700 break-words">{feature}</span>
									</li>
								))}
							</ul>
							<div className="mt-auto">
								<Link
									href={plan.ctaLink}
									className={getButtonClasses(plan)}
								>
									{plan.ctaText}
								</Link>
							</div>
						</div>
					))}
				</div>

				{showViewAllPlans && (
					<div className="text-center mt-12">
						<Link
							href={viewAllPlansLink}
							className="text-orange-600 hover:text-orange-700 font-semibold"
						>
							Ver todos los planes de precios →
						</Link>
					</div>
				)}
			</div>
		</section>
	)
}

export default PricingSection
