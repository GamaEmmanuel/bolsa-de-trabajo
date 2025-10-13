'use client'

import React from 'react'
import Link from 'next/link'
import PricingSection from '../components/PricingSection'

const LandingPage = () => {
	return (
		<div className="min-h-screen bg-white">
			{/* Navigation */}
			<nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
				<div className="max-w-6xl mx-auto px-6">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center">
							<div className="w-10 h-10 bg-orange-500 rounded-full mr-3 flex items-center justify-center">
								<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M13 2L3 14h6v8l10-12h-6V2z"/>
								</svg>
							</div>
							<div className="flex flex-col">
							<span className="text-xl font-bold text-gray-900">TalentFlow</span>
								<span className="text-xs text-orange-500 font-semibold uppercase tracking-wide">CONTRATA, MÁS RÁPIDO</span>
							</div>
						</div>
						<div className="hidden md:flex items-center space-x-8">
						</div>
						<div className="flex items-center space-x-3">
							<Link
								href="/signin"
								className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 transition-colors"
							>
								Iniciar Sesión
							</Link>
							<Link
								href="/signup"
								className="px-5 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
							>
								Comenzar
							</Link>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative pt-24 pb-16 bg-gradient-to-b from-gray-50 to-white">
				<div className="max-w-6xl mx-auto px-6 text-center">
					<div className="max-w-4xl mx-auto">
						<h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
							Plataforma moderna de RRHH para
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600"> contrataciones más inteligentes</span>
						</h1>
						<p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
							Optimiza todo tu proceso de contratación con herramientas impulsadas por IA. Desde la publicación de empleos hasta la incorporación, toma mejores decisiones de contratación más rápido.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
							<Link
								href="/signup"
								className="px-8 py-4 bg-orange-600 text-white text-lg font-semibold rounded-lg hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
							>
								Iniciar Prueba Gratuita
							</Link>
						</div>
					</div>

					{/* Features Preview */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
						<div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
							<div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-3">Emparejamiento con IA</h3>
							<p className="text-gray-600">Empareja automáticamente candidatos con roles usando algoritmos avanzados de IA y análisis de habilidades.</p>
						</div>
						<div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
							<div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-3">Flujo de Trabajo Optimizado</h3>
							<p className="text-gray-600">Gestiona todo tu pipeline de contratación desde un panel con flujos de trabajo automatizados.</p>
						</div>
						<div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
							<div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
								<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-3">Colaboración en Equipo</h3>
							<p className="text-gray-600">Habilita la colaboración perfecta entre gerentes de contratación, reclutadores y miembros del equipo.</p>
						</div>
					</div>
				</div>
			</section>

			{/* Value Proposition */}
			<section className="py-20 bg-white">
				<div className="max-w-6xl mx-auto px-6">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
							¿Por qué elegir TalentFlow?
						</h2>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							Construido para equipos modernos que quieren contratar de manera más inteligente, no más difícil
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
						<div>
							<h3 className="text-3xl font-bold text-gray-900 mb-6">
								Reduce el tiempo de contratación en un 60%
							</h3>
							<p className="text-lg text-gray-600 mb-8 leading-relaxed">
								Nuestra plataforma impulsada por IA automatiza tareas repetitivas, evalúa candidatos de manera inteligente y te ayuda a identificar el mejor talento más rápido que los métodos tradicionales.
							</p>
							<div className="space-y-4">
								<div className="flex items-center">
									<div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
									<span className="text-gray-700">Evaluación automatizada de candidatos</span>
								</div>
								<div className="flex items-center">
									<div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
									<span className="text-gray-700">Programación inteligente de entrevistas</span>
								</div>
								<div className="flex items-center">
									<div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
									<span className="text-gray-700">Herramientas de colaboración en tiempo real</span>
								</div>
							</div>
						</div>
						<div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-gray-100">
							<div className="bg-white rounded-xl p-6 shadow-sm">
								<div className="flex items-center justify-between mb-4">
									<span className="text-sm font-medium text-gray-500">PIPELINE DE CONTRATACIÓN</span>
									<span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">En Vivo</span>
								</div>
								<div className="space-y-3">
									<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<span className="font-medium text-gray-900">Aplicaciones</span>
										<span className="text-2xl font-bold text-gray-900">127</span>
									</div>
									<div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
										<span className="font-medium text-orange-900">Evaluación</span>
										<span className="text-2xl font-bold text-orange-600">34</span>
									</div>
									<div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
										<span className="font-medium text-orange-900">Entrevistas</span>
										<span className="text-2xl font-bold text-orange-600">12</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
						<div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-gray-100 lg:order-2">
							<div className="bg-white rounded-xl p-6 shadow-sm">
								<div className="flex items-center mb-4">
									<div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mr-3"></div>
									<div>
										<div className="font-semibold text-gray-900">Sarah Chen</div>
										<div className="text-sm text-gray-600">Desarrolladora Senior</div>
									</div>
									<div className="ml-auto">
										<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">95% Compatibilidad</span>
									</div>
								</div>
								<div className="text-sm text-gray-600 mb-3">
									5+ años React, Node.js • Anteriormente: Google, Airbnb
								</div>
								<div className="flex space-x-2">
									<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">React</span>
									<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">TypeScript</span>
									<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Node.js</span>
								</div>
							</div>
						</div>
						<div className="lg:order-1">
							<h3 className="text-3xl font-bold text-gray-900 mb-6">
								Encuentra la coincidencia perfecta cada vez
							</h3>
							<p className="text-lg text-gray-600 mb-8 leading-relaxed">
								Los algoritmos avanzados de IA analizan habilidades, experiencia y ajuste cultural para encontrar candidatos que no solo están calificados, sino que son perfectos para tu equipo.
							</p>
							<div className="space-y-4">
								<div className="flex items-center">
									<div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
									<span className="text-gray-700">Emparejamiento basado en habilidades</span>
								</div>
								<div className="flex items-center">
									<div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
									<span className="text-gray-700">Evaluación de ajuste cultural</span>
								</div>
								<div className="flex items-center">
									<div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
									<span className="text-gray-700">Puntuación predictiva de éxito</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Social Proof */}
			<section className="py-16 bg-gray-50">
				<div className="max-w-6xl mx-auto px-6 text-center">
					<h2 className="text-2xl font-bold text-gray-900 mb-12">Confiado por más de 500 empresas en todo el mundo</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
						{['TechCorp', 'StartupXYZ', 'GlobalInc', 'InnovateCo'].map((company, index) => (
							<div key={index} className="text-xl font-bold text-gray-400">
								{company}
							</div>
						))}
					</div>
					<div className="mt-12 bg-white rounded-2xl p-8 max-w-4xl mx-auto shadow-sm border border-gray-100">
						<div className="flex items-center justify-center mb-4">
							{[...Array(5)].map((_, i) => (
								<svg key={i} className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							))}
						</div>
						<blockquote className="text-lg text-gray-700 mb-4">
							&ldquo;TalentFlow redujo nuestro tiempo de contratación de 6 semanas a 2 semanas. El emparejamiento con IA es increíblemente preciso y las funciones de colaboración en equipo son revolucionarias.&rdquo;
						</blockquote>
						<div className="font-semibold text-gray-900">Maria Rodriguez</div>
						<div className="text-gray-600">Jefa de Talento, TechCorp</div>
					</div>
				</div>
			</section>

			{/* Pricing Preview Section */}
			<PricingSection
				showViewAllPlans={true}
				viewAllPlansLink="/pricing"
			/>


			{/* Final CTA Section */}
			<section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
				<div className="max-w-4xl mx-auto px-6 text-center">
					<h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
						¿Listo para transformar tu proceso de contratación?
					</h2>
					<p className="text-xl text-orange-100 mb-8">
						Únete a miles de empresas que ya usan TalentFlow para encontrar y contratar el mejor talento.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							href="/signup?type=company"
							className="px-8 py-4 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
						>
							Iniciar Prueba Gratuita
						</Link>
						<Link
							href="/signup?type=candidate"
							className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-orange-600 transition-colors"
						>
							Buscar Empleos
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 text-white">
				<div className="max-w-6xl mx-auto px-6 py-12">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
						<div className="md:col-span-1">
							<div className="flex items-center mb-4">
								<div className="w-10 h-10 bg-orange-500 rounded-full mr-3 flex items-center justify-center">
									<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
										<path d="M13 2L3 14h6v8l10-12h-6V2z"/>
									</svg>
								</div>
								<div className="flex flex-col">
									<span className="text-xl font-bold text-white">TalentFlow</span>
									<span className="text-xs text-orange-400 font-semibold uppercase tracking-wide">CONTRATA, MÁS RÁPIDO</span>
								</div>
							</div>
							<p className="text-gray-400 mb-4">
								Plataforma moderna de RRHH para decisiones de contratación más inteligentes.
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
								© 2024 TalentFlow. Todos los derechos reservados.
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
		</div>
	)
}

export default LandingPage
