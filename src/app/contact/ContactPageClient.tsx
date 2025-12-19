'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'

const ContactPageClient = () => {
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		company: '',
		phone: '',
		message: '',
	})
	const [submitted, setSubmitted] = useState(false)
	const [loading, setLoading] = useState(false)

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1500))
		console.log('Contact form submitted:', formData)
		setSubmitted(true)
		setLoading(false)
		// In a real application, you would send this data to your backend
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<div className="pt-24 pb-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Header */}
					<div className="text-center mb-16">
						<h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
							Contáctanos
						</h1>
						<p className="mt-4 text-xl text-gray-600">
							¿Tienes preguntas sobre cómo contratar personal o encontrar empleo? Escríbenos y te responderemos en menos de 24 horas.
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
						{/* Contact Form */}
						<div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
							<h3 className="text-2xl font-bold text-gray-900 mb-6">Envíanos un Mensaje</h3>
							{submitted ? (
								<div className="text-center py-10">
									<svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<h2 className="mt-4 text-2xl font-bold text-gray-900">¡Gracias!</h2>
									<p className="mt-2 text-gray-600">Hemos recibido tu mensaje. Te responderemos en 1-2 días hábiles.</p>
									<Link href="/" className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
										Ir a Inicio
									</Link>
								</div>
							) : (
								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
												Nombre
											</label>
											<input
												type="text"
												name="firstName"
												id="firstName"
												value={formData.firstName}
												onChange={handleChange}
												required
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
												placeholder="Juan"
											/>
										</div>
										<div>
											<label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
												Apellido
											</label>
											<input
												type="text"
												name="lastName"
												id="lastName"
												value={formData.lastName}
												onChange={handleChange}
												required
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
												placeholder="Pérez"
											/>
										</div>
									</div>
									<div>
										<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
											Email
										</label>
										<input
											type="email"
											name="email"
											id="email"
											value={formData.email}
											onChange={handleChange}
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
											placeholder="juan@empresa.com"
										/>
									</div>
									<div>
										<label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
											Empresa (opcional)
										</label>
										<input
											type="text"
											name="company"
											id="company"
											value={formData.company}
											onChange={handleChange}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
											placeholder="Tu Restaurante"
										/>
									</div>
									<div>
										<label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
											Teléfono (opcional)
										</label>
										<input
											type="tel"
											name="phone"
											id="phone"
											value={formData.phone}
											onChange={handleChange}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
											placeholder="+52 55 1234 5678"
										/>
									</div>
									<div>
										<label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
											¿Cómo podemos ayudarte?
										</label>
										<textarea
											name="message"
											id="message"
											rows={4}
											value={formData.message}
											onChange={handleChange}
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
											placeholder="Cuéntanos sobre tus necesidades de contratación o búsqueda de empleo..."
										></textarea>
									</div>
									<button
										type="submit"
										disabled={loading}
										className="w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{loading ? 'Enviando mensaje...' : 'Enviar Mensaje'}
									</button>
								</form>
							)}
						</div>

						{/* Contact Information */}
						<div className="space-y-8">
							<div>
								<h3 className="text-2xl font-bold text-gray-900 mb-6">Mantente en Contacto</h3>
								<p className="text-gray-600 mb-8">
									Nuestro equipo está listo para ayudarte con tus necesidades de contratación o búsqueda de empleo.
									Respondemos típicamente en menos de 24 horas.
								</p>
							</div>

							<div className="space-y-6">
								<div className="flex items-start">
									<div className="flex-shrink-0">
										<svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
									</div>
									<div className="ml-4">
										<h4 className="text-lg font-semibold text-gray-900">Email</h4>
										<p className="text-gray-600">contacto@meserea.com</p>
									</div>
								</div>

								<div className="flex items-start">
									<div className="flex-shrink-0">
										<svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div className="ml-4">
										<h4 className="text-lg font-semibold text-gray-900">Horario de Atención</h4>
										<p className="text-gray-600">Lun-Vie, 9 AM - 6 PM (hora CDMX)</p>
									</div>
								</div>
							</div>

							<div className="bg-pink-50 p-6 rounded-lg">
								<h4 className="text-lg font-semibold text-pink-900 mb-2">¿Listo para empezar?</h4>
								<p className="text-pink-800 mb-4">
									Puedes comenzar inmediatamente con nuestra prueba gratuita de 7 días.
								</p>
								<div className="flex flex-col sm:flex-row gap-3">
									<Link
										href="/signup?type=candidate"
										className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors text-center"
									>
										Buscar Empleo
									</Link>
									<Link
										href="/signup?type=company"
										className="px-4 py-2 bg-white text-pink-600 border border-pink-600 rounded-lg font-medium hover:bg-pink-50 transition-colors text-center"
									>
										Publicar Vacante
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ContactPageClient

