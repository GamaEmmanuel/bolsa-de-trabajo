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
	buttonStyle?: 'primary' | 'secondary' | 'outline' | 'enterprise'
	planId?: string
	amount?: number
}

interface FullPricingSectionProps {
	title?: string
	subtitle?: string
	showFAQ?: boolean
	className?: string
}

const FullPricingSection: React.FC<FullPricingSectionProps> = ({
	title = "Precios simples y transparentes",
	subtitle = "Comienza gratis y escala mientras creces. Sin tarifas ocultas, sin sorpresas.",
	showFAQ = true,
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
				"Seguimiento de aplicaciones",
				"Alertas de empleo y notificaciones",
				"Información de empresas",
				"Interfaz compatible con móviles"
			],
			ctaText: "Comenzar Gratis",
			ctaLink: "/signup?type=candidate",
			buttonStyle: "primary",
			planId: "free",
			amount: 0
		},
		{
			name: "Startup",
			price: "$99",
			period: "/mes",
			description: "Perfecto para empresas en crecimiento",
			features: [
				"Hasta 5 publicaciones de empleo activas",
				"ATS básico (Sistema de Seguimiento de Aplicantes)",
				"Evaluación y filtrado de currículums",
				"Notificaciones por email",
				"Panel de análisis básico",
				"Gestión de perfil de empresa",
				"Soporte estándar"
			],
			ctaText: "Suscribirse Ahora",
			ctaLink: "/company/subscription/checkout?plan=startup",
			popular: true,
			buttonStyle: "primary",
			planId: "startup",
			amount: 9900
		},
		{
			name: "Professional",
			price: "$299",
			period: "/mes",
			description: "Para empresas establecidas",
			features: [
				"Hasta 25 publicaciones de empleo activas",
				"ATS avanzado con flujos de trabajo personalizados",
				"Emparejamiento de candidatos con IA",
				"Herramientas de programación de entrevistas",
				"Análisis y reportes avanzados",
				"Funciones de colaboración en equipo",
				"Soporte prioritario",
				"Opciones de marca personalizada"
			],
			ctaText: "Suscribirse Ahora",
			ctaLink: "/company/subscription/checkout?plan=professional",
			buttonStyle: "secondary",
			planId: "professional",
			amount: 29900
		},
		{
			name: "Enterprise",
			price: "Personalizado",
			description: "Soluciones a medida para grandes organizaciones",
			features: [
				"Publicaciones de empleo ilimitadas",
				"ATS completo con acceso API",
				"IA avanzada y aprendizaje automático",
				"Integraciones personalizadas",
				"Gerente de cuenta dedicado",
				"Soluciones de marca blanca",
				"Soporte premium 24/7",
				"Capacitación y incorporación personalizada"
			],
			ctaText: "Contactar Ventas",
			ctaLink: "/contact",
			buttonStyle: "enterprise",
			planId: "enterprise",
			amount: 0
		}
	]

	const faqItems = [
		{
			question: "¿Puedo cambiar de plan en cualquier momento?",
			answer: "¡Sí! Puedes actualizar o reducir tu plan en cualquier momento. Los cambios toman efecto inmediatamente."
		},
		{
			question: "¿Hay una prueba gratuita?",
			answer: "Todos los planes pagos incluyen una prueba gratuita de 14 días. No se requiere tarjeta de crédito para comenzar."
		},
		{
			question: "¿Qué métodos de pago aceptan?",
			answer: "Aceptamos todas las principales tarjetas de crédito, PayPal y transferencias bancarias para planes Enterprise."
		},
		{
			question: "¿Ofrecen reembolsos?",
			answer: "Sí, ofrecemos una garantía de devolución de dinero de 30 días para todos los planes pagos."
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
			case 'enterprise':
				return `${baseClasses} bg-orange-600 text-white hover:bg-orange-700`
			default:
				return `${baseClasses} bg-orange-600 text-white hover:bg-orange-700`
		}
	}

	return (
		<div className={`py-16 ${className}`}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="text-center mb-16">
					<h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
						{title}
					</h1>
					<p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
						{subtitle}
					</p>
				</div>

				{/* Pricing Tiers */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
									<span className="text-4xl font-bold text-gray-900">{plan.price}</span>
									{plan.period && (
										<span className="text-gray-500">{plan.period}</span>
									)}
								</div>
								<p className="mt-2 text-gray-600">{plan.description}</p>
							</div>
							<ul className="space-y-4 mb-8 flex-grow">
								{plan.features.map((feature, featureIndex) => (
									<li key={featureIndex} className="flex items-start">
										<svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
										<span className="text-gray-700">{feature}</span>
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

				{/* FAQ Section */}
				{showFAQ && (
					<div className="mt-20">
						<h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
							Preguntas Frecuentes
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
							{faqItems.map((item, index) => (
								<div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										{item.question}
									</h3>
									<p className="text-gray-600">
										{item.answer}
									</p>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default FullPricingSection
