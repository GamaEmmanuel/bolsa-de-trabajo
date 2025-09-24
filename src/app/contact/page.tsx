'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'

const ContactPage = () => {
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
							Contact Sales
						</h1>
						<p className="mt-4 text-xl text-gray-600">
							Interested in our Enterprise plan or have specific questions? Fill out the form below and we'll get back to you shortly.
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
						{/* Contact Form */}
						<div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
							<h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Our Sales Team</h3>
							{submitted ? (
								<div className="text-center py-10">
									<svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<h2 className="mt-4 text-2xl font-bold text-gray-900">Thank You!</h2>
									<p className="mt-2 text-gray-600">Your message has been received. We'll be in touch within 1-2 business days.</p>
									<Link href="/" className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
										Go to Homepage
									</Link>
								</div>
							) : (
								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
												First Name
											</label>
											<input
												type="text"
												name="firstName"
												id="firstName"
												value={formData.firstName}
												onChange={handleChange}
												required
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												placeholder="John"
											/>
										</div>
										<div>
											<label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
												Last Name
											</label>
											<input
												type="text"
												name="lastName"
												id="lastName"
												value={formData.lastName}
												onChange={handleChange}
												required
												className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												placeholder="Doe"
											/>
										</div>
									</div>
									<div>
										<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
											Work Email
										</label>
										<input
											type="email"
											name="email"
											id="email"
											value={formData.email}
											onChange={handleChange}
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											placeholder="john@company.com"
										/>
									</div>
									<div>
										<label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
											Company Name
										</label>
										<input
											type="text"
											name="company"
											id="company"
											value={formData.company}
											onChange={handleChange}
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											placeholder="Your Company"
										/>
									</div>
									<div>
										<label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
											Phone Number
										</label>
										<input
											type="tel"
											name="phone"
											id="phone"
											value={formData.phone}
											onChange={handleChange}
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											placeholder="+1 (555) 123-4567"
										/>
									</div>
									<div>
										<label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
											How can we help you?
										</label>
										<textarea
											name="message"
											id="message"
											rows={4}
											value={formData.message}
											onChange={handleChange}
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											placeholder="Tell us about your hiring needs and we'll get back to you within 24 hours."
										></textarea>
									</div>
									<button
										type="submit"
										disabled={loading}
										className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{loading ? 'Sending Message...' : 'Send Message'}
									</button>
								</form>
							)}
						</div>

						{/* Contact Information */}
						<div className="space-y-8">
							<div>
								<h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
								<p className="text-gray-600 mb-8">
									Our sales team is ready to help you find the perfect solution for your hiring needs.
									We typically respond within 24 hours.
								</p>
							</div>

							<div className="space-y-6">
								<div className="flex items-start">
									<div className="flex-shrink-0">
										<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
									</div>
									<div className="ml-4">
										<h4 className="text-lg font-semibold text-gray-900">Email</h4>
										<p className="text-gray-600">sales@talentflow.com</p>
									</div>
								</div>

								<div className="flex items-start">
									<div className="flex-shrink-0">
										<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
										</svg>
									</div>
									<div className="ml-4">
										<h4 className="text-lg font-semibold text-gray-900">Phone</h4>
										<p className="text-gray-600">+1 (555) 123-4567</p>
									</div>
								</div>

								<div className="flex items-start">
									<div className="flex-shrink-0">
										<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div className="ml-4">
										<h4 className="text-lg font-semibold text-gray-900">Business Hours</h4>
										<p className="text-gray-600">Mon-Fri, 9 AM - 6 PM PST</p>
									</div>
								</div>
							</div>

							<div className="bg-blue-50 p-6 rounded-lg">
								<h4 className="text-lg font-semibold text-blue-900 mb-2">Quick Start</h4>
								<p className="text-blue-800 mb-4">
									Ready to get started right away? Try our free plan or start a 14-day free trial.
								</p>
								<div className="flex flex-col sm:flex-row gap-3">
									<Link
										href="/signup?type=candidate"
										className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
									>
										Start as Job Seeker
									</Link>
									<Link
										href="/signup?type=company"
										className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-center"
									>
										Start as Company
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

export default ContactPage
