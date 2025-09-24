'use client'

import React, { useState } from 'react'
import Header from '../../components/Header'

const ContactPage = () => {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		company: '',
		phone: '',
		message: ''
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		// Handle form submission
		console.log('Contact form submitted:', formData)
		alert('Thank you for your interest! We\'ll get back to you within 24 hours.')
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		})
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
					<p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
						Ready to transform your hiring process? Let's discuss how TalentFlow can help your organization.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
					{/* Contact Form */}
					<div className="bg-white rounded-2xl shadow-lg p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">
							Get in touch
						</h2>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
										Full Name *
									</label>
									<input
										type="text"
										id="name"
										name="name"
										required
										value={formData.name}
										onChange={handleChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										placeholder="John Doe"
									/>
								</div>
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
										Email Address *
									</label>
									<input
										type="email"
										id="email"
										name="email"
										required
										value={formData.email}
										onChange={handleChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										placeholder="john@company.com"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
										Company *
									</label>
									<input
										type="text"
										id="company"
										name="company"
										required
										value={formData.company}
										onChange={handleChange}
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
										id="phone"
										name="phone"
										value={formData.phone}
										onChange={handleChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										placeholder="+1 (555) 123-4567"
									/>
								</div>
							</div>

							<div>
								<label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
									Message *
								</label>
								<textarea
									id="message"
									name="message"
									required
									rows={4}
									value={formData.message}
									onChange={handleChange}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									placeholder="Tell us about your hiring needs and how we can help..."
								/>
							</div>

							<button
								type="submit"
								className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
							>
								Send Message
							</button>
						</form>
					</div>

					{/* Contact Information */}
					<div className="space-y-8">
						<div className="bg-white rounded-2xl shadow-lg p-8">
							<h3 className="text-xl font-bold text-gray-900 mb-6">
								Why choose Enterprise?
							</h3>
							<ul className="space-y-4">
								<li className="flex items-start">
									<svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									<span className="text-gray-700">Unlimited job postings and candidates</span>
								</li>
								<li className="flex items-start">
									<svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									<span className="text-gray-700">Custom integrations and API access</span>
								</li>
								<li className="flex items-start">
									<svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									<span className="text-gray-700">Dedicated account manager</span>
								</li>
								<li className="flex items-start">
									<svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									<span className="text-gray-700">24/7 premium support</span>
								</li>
								<li className="flex items-start">
									<svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									<span className="text-gray-700">White-label solutions</span>
								</li>
							</ul>
						</div>

						<div className="bg-blue-50 rounded-2xl p-8">
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Get in touch
							</h3>
							<div className="space-y-4">
								<div className="flex items-center">
									<svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<span className="text-gray-700">sales@talentflow.com</span>
								</div>
								<div className="flex items-center">
									<svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
									</svg>
									<span className="text-gray-700">+1 (555) 123-4567</span>
								</div>
								<div className="flex items-center">
									<svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span className="text-gray-700">Mon-Fri 9AM-6PM PST</span>
								</div>
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
