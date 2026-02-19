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
			name: "Empresa",
			price: "$10 mx",
			period: "/publicación",
			description: "Paga solo por lo que publicas",
			features: [
				"Pago por publicación de empleo",
				"ATS avanzado incluido",
				"Evaluación y filtrado de currículums",
				"Notificaciones automáticas",
				"Dashboard de análisis",
				"Soporte incluido",
				"Hasta 100 candidatos por publicación"
			],
			ctaText: "Publicar Empleo",
			ctaLink: "/signup?type=company",
			popular: true,
			buttonStyle: "primary",
			planId: "per-job",
			amount: 1000
		},
		{
			name: "Enterprise",
			price: "Personalizado",
			description: "Capacidades a la medida de tus necesidades, adaptamos la plataforma para tus workflows",
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
			question: "¿Cómo funciona el plan gratuito para candidatos?",
			answer: "El plan gratuito te permite aplicar a empleos ilimitados, crear tu currículum profesional, recibir alertas de trabajo y hacer seguimiento de tus aplicaciones. No necesitas tarjeta de crédito para comenzar."
		},
		{
			question: "¿Cómo funciona el pago por publicación?",
			answer: "Cada vez que quieras publicar una vacante, pagas $10 MXN. Puedes crear borradores sin costo y solo pagas al momento de publicar. Tu vacante se mantiene activa hasta que la cierres o la llenes."
		},
		{
			question: "¿Qué incluye cada publicación?",
			answer: "Cada publicación incluye ATS avanzado, evaluación y filtrado de currículums, notificaciones automáticas, dashboard de análisis, soporte y hasta 100 candidatos por publicación."
		},
		{
			question: "¿Qué métodos de pago aceptan?",
			answer: "Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express). El pago se procesa de forma segura a través de Stripe."
		},
		{
			question: "¿Puedo crear vacantes sin pagar?",
			answer: "Sí, puedes crear y guardar borradores de vacantes sin costo. Solo pagas cuando decides publicar la vacante para que los candidatos la vean."
		},
		{
			question: "¿Cuánto tiempo dura mi publicación activa?",
			answer: "Tu publicación se mantiene activa hasta que tú decidas cerrarla o marcarla como llenada. No hay límite de tiempo."
		},
		{
			question: "¿Mis datos están seguros?",
			answer: "Absolutamente. Utilizamos encriptación de nivel bancario, cumplimos con GDPR y realizamos auditorías de seguridad regulares. Tus datos nunca se comparten con terceros sin tu consentimiento."
		},
		{
			question: "¿Qué diferencia al plan Enterprise?",
			answer: "El plan Enterprise ofrece integraciones personalizadas, API completa, gerente de cuenta dedicado, soporte 24/7 premium y capacitación personalizada para tu equipo."
		},
		{
			question: "¿Puedo exportar mis datos si decido cambiar de plataforma?",
			answer: "Por supuesto. Puedes exportar todos tus datos (candidatos, publicaciones, análisis) en cualquier momento en formatos CSV o JSON."
		},
		{
			question: "¿Hay cargos ocultos o comisiones adicionales?",
			answer: "No. Pagas $10 MXN por publicación y nada más. Sin cargos de configuración, sin comisiones por contratación, sin costos ocultos."
		}
	]

	const getButtonClasses = (plan: PricingPlan) => {
		const baseClasses = "block w-full text-center py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold transition-colors"

		switch (plan.buttonStyle) {
			case 'primary':
				return `${baseClasses} bg-pink-600 text-white hover:bg-pink-700`
			case 'secondary':
				return `${baseClasses} bg-gray-900 text-white hover:bg-gray-800`
			case 'outline':
				return `${baseClasses} border-2 border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white`
			case 'enterprise':
				return `${baseClasses} bg-pink-600 text-white hover:bg-pink-700`
			default:
				return `${baseClasses} bg-pink-600 text-white hover:bg-pink-700`
		}
	}

	return (
		<div className={`py-8 sm:py-12 md:py-16 ${className}`}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="text-center mb-8 sm:mb-12 md:mb-16">
					<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
						{title}
					</h1>
					<p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
						{subtitle}
					</p>
				</div>

				{/* Pricing Tiers */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
					{pricingPlans.map((plan, index) => (
						<div
							key={index}
							className={`bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 flex flex-col h-full ${
								plan.popular
									? 'border-pink-500 relative sm:transform sm:scale-105 shadow-lg'
									: 'border-gray-100 hover:border-pink-200'
							} transition-all duration-300`}
						>
							{plan.popular && (
								<div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
									<span className="bg-pink-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">
										Más Popular
									</span>
								</div>
							)}
							<div className="text-center mb-6 sm:mb-8">
								<h3 className="text-xl sm:text-2xl font-bold text-gray-900">{plan.name}</h3>
								<div className="mt-3 sm:mt-4">
									<span className={`font-bold text-gray-900 ${plan.price.length > 8 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>{plan.price}</span>
									{plan.period && (
										<span className="text-sm sm:text-base text-gray-500">{plan.period}</span>
									)}
								</div>
								<p className="mt-2 text-sm sm:text-base text-gray-600 break-words">{plan.description}</p>
							</div>
							<ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
								{plan.features.map((feature, featureIndex) => (
									<li key={featureIndex} className="flex items-start">
										<svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
										<span className="text-sm sm:text-base text-gray-700 break-words">{feature}</span>
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
					<div className="mt-12 sm:mt-16 md:mt-20">
						<h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12 px-4">
							Preguntas Frecuentes
						</h2>
						<div className="max-w-4xl mx-auto">
							<div className="space-y-4 sm:space-y-6">
								{faqItems.map((item, index) => (
									<div key={index} className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0">
										<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
											{item.question}
										</h3>
										<p className="text-sm sm:text-base text-gray-600 leading-relaxed">
											{item.answer}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default FullPricingSection
