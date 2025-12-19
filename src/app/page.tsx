'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PricingSection from '../components/PricingSection'
import PublicJobListings from '../components/PublicJobListings'

type TabType = 'home' | 'jobs'

const LandingPage = () => {
	const [activeTab, setActiveTab] = useState<TabType>('home')

	// Add structured data and meta tags for SEO
	useEffect(() => {
		// Update page title and meta description
		document.title = "Meserea - Encuentra Trabajo en Restaurantes y Hoteles | Empleos de Mesero, Chef, Cocinero"

		let metaDesc = document.querySelector('meta[name="description"]')
		if (!metaDesc) {
			metaDesc = document.createElement('meta')
			metaDesc.setAttribute('name', 'description')
			document.head.appendChild(metaDesc)
		}
		metaDesc.setAttribute('content', 'La plataforma #1 para encontrar trabajo en restaurantes, hoteles y el sector de hospitalidad. Empleos de mesero, cocinero, chef, bartender, camarera y más.')

		// Add LocalBusiness structured data
		const localBusinessSchema = {
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'Meserea',
			url: 'https://meserea.com',
			potentialAction: {
				'@type': 'SearchAction',
				target: {
					'@type': 'EntryPoint',
					urlTemplate: 'https://meserea.com/jobs?q={search_term_string}'
				},
				'query-input': 'required name=search_term_string'
			}
		}

		const schemaScript = document.createElement('script')
		schemaScript.type = 'application/ld+json'
		schemaScript.text = JSON.stringify(localBusinessSchema)
		schemaScript.id = 'website-schema'

		if (!document.getElementById('website-schema')) {
			document.head.appendChild(schemaScript)
		}

		// Cleanup
		return () => {
			const script = document.getElementById('website-schema')
			if (script) script.remove()
		}
	}, [])

	return (
		<div className="min-h-screen bg-white">
			{/* Navigation */}
			<nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="flex justify-between items-center py-3 sm:py-4">
						<button
							onClick={() => setActiveTab('home')}
							className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
						>
						<Image
							src="/logo.png"
							alt="Meserea Logo"
							width={180}
							height={60}
							className="h-10 sm:h-12 w-auto"
						/>
						</button>
						<div className="hidden md:flex items-center space-x-8">
							<button
								onClick={() => setActiveTab('home')}
								className={`font-medium px-3 py-2 transition-colors ${
									activeTab === 'home'
										? 'text-pink-600 border-b-2 border-pink-600'
										: 'text-gray-700 hover:text-gray-900'
								}`}
							>
								Inicio
							</button>
							<button
								onClick={() => setActiveTab('jobs')}
								className={`font-medium px-3 py-2 transition-colors ${
									activeTab === 'jobs'
										? 'text-pink-600 border-b-2 border-pink-600'
										: 'text-gray-700 hover:text-gray-900'
								}`}
							>
								Empleos Disponibles
							</button>
						</div>
						<div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
							<Link
								href="/signin"
								className="text-gray-700 hover:text-gray-900 font-medium px-3 sm:px-4 py-2 transition-colors text-sm sm:text-base"
							>
								Iniciar Sesión
							</Link>
							<Link
								href="/signup"
								className="px-4 sm:px-5 py-2 sm:py-2.5 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors text-sm sm:text-base"
							>
								Comenzar
							</Link>
						</div>
						<div className="sm:hidden">
							<Link
								href="/signup"
								className="px-4 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors text-sm"
							>
								Comenzar
							</Link>
						</div>
					</div>
				</div>
				{/* Mobile Tab Navigation */}
				<div className="md:hidden border-t border-gray-100">
					<div className="flex">
						<button
							onClick={() => setActiveTab('home')}
							className={`flex-1 text-center py-3 font-medium transition-colors text-sm sm:text-base ${
								activeTab === 'home'
									? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
									: 'text-gray-700'
							}`}
						>
							Inicio
						</button>
						<button
							onClick={() => setActiveTab('jobs')}
							className={`flex-1 text-center py-3 font-medium transition-colors text-sm sm:text-base ${
								activeTab === 'jobs'
									? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
									: 'text-gray-700'
							}`}
						>
							Empleos
						</button>
					</div>
				</div>
			</nav>

			{/* Jobs Section */}
			{activeTab === 'jobs' && (
				<section className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 bg-gray-50 min-h-screen overflow-hidden">
					{/* Container to constrain illustration positioning */}
					<div className="absolute inset-0 max-w-[1600px] mx-auto pointer-events-none">
					{/* Decorative Background Illustration - Top Right */}
						<div className="hidden lg:block absolute top-32 right-0 lg:right-4 xl:right-12 w-80 lg:w-96 h-80 lg:h-96 opacity-40">
						<Image
							src="/illustrations/pizza, slice, food, cuisine, cartoon, illustration, character.png"
							alt=""
							width={384}
							height={384}
							className="transform rotate-8"
						/>
						</div>
					</div>
					<div className="max-w-7xl mx-auto px-4 sm:px-6">
						<div className="text-center mb-6 sm:mb-8">
							<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
								Empleos en Restaurantes y Hoteles
							</h1>
							<p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
								Encuentra oportunidades como mesero, cocinero, chef, bartender, camarera y más en el sector de hospitalidad.
							<Link href="/signup" className="text-pink-600 hover:text-pink-700 font-semibold"> Regístrate</Link> para aplicar.
							</p>
						</div>
						<PublicJobListings />
					</div>
				</section>
			)}

			{/* Hero Section */}
			{activeTab === 'home' && (
			<>
			<section className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
				{/* Container to constrain illustration positioning */}
				<div className="absolute inset-0 max-w-[1600px] mx-auto pointer-events-none">
				{/* Decorative Background Illustration - Top Right */}
					<div className="hidden lg:block absolute top-10 right-0 lg:right-4 xl:right-12 w-80 lg:w-96 h-80 lg:h-96 opacity-40">
					<Image
						src="/illustrations/chef, cooking, meal preparation, food service, kitchen, Vector illustration.png"
						alt=""
						width={384}
						height={384}
						className="transform rotate-12"
					/>
				</div>
				{/* Decorative Background Illustration - Left Side */}
					<div className="hidden lg:block absolute top-40 left-0 lg:left-4 xl:left-12 -translate-x-16 lg:-translate-x-12 w-64 lg:w-80 h-64 lg:h-80 opacity-40">
					<Image
						src="/illustrations/cooking, food preparation, kitchen, sandwich, Vector illustration.png"
						alt=""
						width={320}
						height={320}
						className="transform -rotate-15"
					/>
					</div>
				</div>
				<div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
					<div className="max-w-4xl mx-auto">
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6 px-2">
							Encuentra el mejor talento para tu
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-pink-700"> restaurante u hotel</span>
						</h1>
						<p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
							Contrata meseros, cocineros, camareras, chefs, bartenders y más personal de servicio de manera rápida y eficiente. Plataforma especializada en el sector de hospitalidad.
						</p>
						<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
							<Link
								href="/signup"
								className="px-6 sm:px-8 py-3 sm:py-4 bg-pink-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
							>
								Iniciar Prueba Gratuita
							</Link>
						</div>
					</div>

					{/* Features Preview */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto mt-12 sm:mt-20 px-4">
						<div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
							<div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Personal Calificado</h3>
							<p className="text-sm sm:text-base text-gray-600">Encuentra meseros, cocineros, chefs, bartenders y personal de limpieza verificado y listo para trabajar.</p>
						</div>
						<div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
							<div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</div>
							<h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Contratación Rápida</h3>
							<p className="text-sm sm:text-base text-gray-600">Publica una vacante y recibe aplicaciones calificadas en minutos. Ideal para cubrir turnos urgentes.</p>
						</div>
						<div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
							<div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
							<h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Especializado en Hospitalidad</h3>
							<p className="text-sm sm:text-base text-gray-600">Plataforma diseñada específicamente para restaurantes, hoteles, cafeterías y el sector de servicio.</p>
						</div>
					</div>
				</div>
			</section>

			{/* Value Proposition */}
			<section className="relative py-12 sm:py-16 md:py-20 bg-white overflow-hidden">
				{/* Container to constrain illustration positioning */}
				<div className="absolute inset-0 max-w-[1600px] mx-auto pointer-events-none">
				{/* Decorative Background Illustration - Top Right */}
					<div className="hidden lg:block absolute top-20 right-0 lg:right-4 xl:right-12 w-80 lg:w-96 h-80 lg:h-96 opacity-35">
					<Image
						src="/illustrations/cooking, tasting, chef, kitchen, culinary.png"
						alt=""
						width={384}
						height={384}
						className="transform rotate-6"
					/>
				</div>
				{/* Decorative Background Illustration - Bottom Left */}
					<div className="hidden lg:block absolute bottom-32 left-0 lg:left-4 xl:left-12 -translate-x-12 lg:-translate-x-8 w-80 lg:w-96 h-80 lg:h-96 opacity-35">
					<Image
						src="/illustrations/frying-pan, egg, spatula, cooking, breakfast.png"
						alt=""
						width={384}
						height={384}
						className="transform -rotate-12"
					/>
					</div>
				</div>
				<div className="max-w-6xl mx-auto px-4 sm:px-6">
					<div className="text-center mb-12 sm:mb-16">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
							¿Por qué elegir Meserea?
						</h2>
						<p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
							La plataforma #1 para restaurantes y hoteles que necesitan contratar personal de servicio calificado
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mb-12 sm:mb-16 lg:mb-20">
						<div className="px-4">
							<h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
								Contrata personal en horas, no en semanas
							</h3>
							<p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
								Publicar una vacante para meseros, cocineros, chefs, bartenders o camareras nunca ha sido tan fácil. Recibe aplicaciones calificadas en minutos y contrata el mismo día.
							</p>
							<div className="space-y-3 sm:space-y-4">
								<div className="flex items-start sm:items-center">
									<div className="w-2 h-2 bg-pink-600 rounded-full mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
									<span className="text-sm sm:text-base text-gray-700">Candidatos verificados con experiencia en hospitalidad</span>
								</div>
								<div className="flex items-start sm:items-center">
									<div className="w-2 h-2 bg-pink-600 rounded-full mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
									<span className="text-sm sm:text-base text-gray-700">Disponibilidad inmediata para turnos urgentes</span>
								</div>
								<div className="flex items-start sm:items-center">
									<div className="w-2 h-2 bg-pink-600 rounded-full mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
									<span className="text-sm sm:text-base text-gray-700">Contacto directo con aspirantes</span>
								</div>
							</div>
						</div>
						<div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100 mx-4 sm:mx-0">
							<div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
								<div className="flex items-center justify-between mb-3 sm:mb-4">
									<span className="text-xs sm:text-sm font-medium text-gray-500">PIPELINE DE CONTRATACIÓN</span>
									<span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Demo</span>
								</div>
								<div className="space-y-2 sm:space-y-3">
									<div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
										<span className="text-sm sm:text-base font-medium text-gray-900">Aplicaciones</span>
										<span className="text-xl sm:text-2xl font-bold text-gray-900">127</span>
									</div>
									<div className="flex items-center justify-between p-2 sm:p-3 bg-pink-50 rounded-lg">
										<span className="text-sm sm:text-base font-medium text-pink-900">Evaluación</span>
										<span className="text-xl sm:text-2xl font-bold text-pink-600">34</span>
									</div>
									<div className="flex items-center justify-between p-2 sm:p-3 bg-pink-50 rounded-lg">
										<span className="text-sm sm:text-base font-medium text-pink-900">Entrevistas</span>
										<span className="text-xl sm:text-2xl font-bold text-pink-600">12</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
						<div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100 lg:order-2 mx-4 sm:mx-0">
							<div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
								<div className="flex items-start sm:items-center mb-3 sm:mb-4">
									<div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full mr-3 flex-shrink-0"></div>
									<div className="flex-1 min-w-0">
										<div className="text-sm sm:text-base font-semibold text-gray-900 truncate">Sarah Chen</div>
										<div className="text-xs sm:text-sm text-gray-600">Desarrolladora Senior</div>
									</div>
									<div className="ml-2">
										<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap">95% Match</span>
									</div>
								</div>
								<div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
									5+ años React, Node.js • Anteriormente: Google, Airbnb
								</div>
								<div className="flex flex-wrap gap-2">
									<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">React</span>
									<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">TypeScript</span>
									<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Node.js</span>
								</div>
							</div>
						</div>
						<div className="lg:order-1 px-4">
							<h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
								Personal especializado para tu negocio
							</h3>
							<p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
								Accede a una base de datos de profesionales de hospitalidad: meseros con experiencia, cocineros capacitados, chefs certificados, bartenders expertos, camareras de hotel y más.
							</p>
							<div className="space-y-3 sm:space-y-4">
								<div className="flex items-start sm:items-center">
									<div className="w-2 h-2 bg-pink-600 rounded-full mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
									<span className="text-sm sm:text-base text-gray-700">Experiencia comprobada en el sector</span>
								</div>
								<div className="flex items-start sm:items-center">
									<div className="w-2 h-2 bg-pink-600 rounded-full mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
									<span className="text-sm sm:text-base text-gray-700">Referencias y certificaciones verificadas</span>
								</div>
								<div className="flex items-start sm:items-center">
									<div className="w-2 h-2 bg-pink-600 rounded-full mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
									<span className="text-sm sm:text-base text-gray-700">Perfiles completos con disponibilidad</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Social Proof */}
			<section className="relative py-12 sm:py-16 bg-gray-50 overflow-hidden">
				{/* Container to constrain illustration positioning */}
				<div className="absolute inset-0 max-w-[1600px] mx-auto pointer-events-none">
				{/* Decorative Background Illustration - Right Side */}
					<div className="hidden lg:block absolute top-10 right-0 lg:right-4 xl:right-12 translate-x-8 lg:translate-x-4 w-80 lg:w-96 h-80 lg:h-96 opacity-35">
					<Image
						src="/illustrations/pizza, slice, food, cuisine, cartoon, illustration, character.png"
						alt=""
						width={384}
						height={384}
						className="transform rotate-18"
					/>
				</div>
				{/* Decorative Background Illustration - Left Bottom */}
					<div className="hidden lg:block absolute bottom-10 left-0 lg:left-4 xl:left-12 -translate-x-8 lg:-translate-x-4 w-64 lg:w-80 h-64 lg:h-80 opacity-35">
					<Image
						src="/illustrations/chopsticks, dollar, steaming, currency, cuisine.png"
						alt=""
						width={320}
						height={320}
						className="transform -rotate-20"
					/>
					</div>
				</div>
				<div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8 sm:mb-12 px-2">Confiado por restaurantes y hoteles en toda Latinoamérica</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 items-center opacity-60 mb-8 sm:mb-12">
						{['Restaurante El Buen Sabor', 'Hotel Plaza', 'Café Gourmet', 'Grupo Hotelero'].map((company, index) => (
							<div key={index} className="text-sm sm:text-lg md:text-xl font-bold text-gray-400">
								{company}
							</div>
						))}
					</div>
					<div className="bg-white rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto shadow-sm border border-gray-100">
						<div className="flex items-center justify-center mb-3 sm:mb-4">
							{[...Array(5)].map((_, i) => (
								<svg key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							))}
						</div>
						<blockquote className="text-base sm:text-lg text-gray-700 mb-3 sm:mb-4 px-2">
							&ldquo;Necesitábamos 3 meseros urgente para el fin de semana y Meserea nos ayudó a encontrarlos en menos de 24 horas. Personal calificado y con experiencia. ¡Increíble!&rdquo;
						</blockquote>
						<div className="text-sm sm:text-base font-semibold text-gray-900">Carlos Martínez</div>
						<div className="text-xs sm:text-sm text-gray-600">Gerente General, Restaurante La Hacienda</div>
					</div>
				</div>
			</section>

			{/* Pricing Preview Section */}
			<PricingSection
				showViewAllPlans={true}
				viewAllPlansLink="/pricing"
			/>


			{/* Final CTA Section */}
			<section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-pink-500 to-pink-600">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
					<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
						¿Necesitas personal para tu restaurante u hotel?
					</h2>
					<p className="text-base sm:text-lg md:text-xl text-pink-50 mb-6 sm:mb-8 px-4">
						Únete a cientos de restaurantes y hoteles que encuentran meseros, cocineros, chefs y personal de servicio en Meserea.
					</p>
					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
						<Link
							href="/signup?type=company"
							className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-pink-600 text-sm sm:text-base font-semibold rounded-lg hover:bg-gray-100 transition-colors"
						>
							Publicar Vacante
						</Link>
						<Link
							href="/signup?type=candidate"
							className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-white hover:text-pink-600 transition-colors"
						>
							Buscar Trabajo en Hospitalidad
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 text-white">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
						<div className="md:col-span-1">
							<div className="flex items-center mb-4">
							<Image
								src="/logo.png"
								alt="Meserea Logo"
								width={180}
								height={60}
								className="h-12 w-auto brightness-0 invert"
							/>
							</div>
							<p className="text-gray-400 mb-4">
							Encuentra chamba en restaurantes y hoteles. La plataforma #1 en Latinoamérica.
							</p>
							<div className="flex space-x-4">
								<Link href="#" className="text-gray-400 hover:text-white transition-colors">
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
									</svg>
								</Link>
								<Link href="#" className="text-gray-400 hover:text-white transition-colors">
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
									</svg>
								</Link>
							</div>
						</div>
						<div>
							<h4 className="font-semibold text-white mb-4">Producto</h4>
							<ul className="space-y-2 text-gray-400 text-sm">
								<li><Link href="/platform" className="hover:text-white transition-colors">Plataforma</Link></li>
								<li><Link href="/pricing" className="hover:text-white transition-colors">Precios</Link></li>
								<li><Link href="/integrations" className="hover:text-white transition-colors">Integraciones</Link></li>
								<li><Link href="/security" className="hover:text-white transition-colors">Seguridad</Link></li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold text-white mb-4">Empresa</h4>
							<ul className="space-y-2 text-gray-400 text-sm">
								<li><Link href="/about" className="hover:text-white transition-colors">Acerca de</Link></li>
								<li><Link href="/careers" className="hover:text-white transition-colors">Carreras</Link></li>
								<li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
								<li><Link href="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold text-white mb-4">Soporte</h4>
							<ul className="space-y-2 text-gray-400 text-sm">
								<li><Link href="/help" className="hover:text-white transition-colors">Centro de Ayuda</Link></li>
								<li><Link href="/docs" className="hover:text-white transition-colors">Documentación</Link></li>
								<li><Link href="/status" className="hover:text-white transition-colors">Estado</Link></li>
								<li><Link href="/support" className="hover:text-white transition-colors">Contactar Soporte</Link></li>
							</ul>
						</div>
					</div>
					<div className="border-t border-gray-800 pt-8">
						<div className="flex flex-col md:flex-row justify-between items-center">
							<p className="text-gray-400 text-sm mb-4 md:mb-0">
							© 2024 Meserea. Todos los derechos reservados.
							</p>
							<div className="flex space-x-6 text-sm text-gray-400">
								<Link href="/privacy" className="hover:text-white transition-colors">Política de Privacidad</Link>
								<Link href="/terms" className="hover:text-white transition-colors">Términos de Servicio</Link>
								<Link href="/cookies" className="hover:text-white transition-colors">Política de Cookies</Link>
							</div>
						</div>
					</div>
				</div>
			</footer>
			</>
			)}
		</div>
	)
}

export default LandingPage
