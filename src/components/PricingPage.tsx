'use client'

import React from 'react'
import Link from 'next/link'

interface PricingTier {
	name: string
	price: string
	description: string
	features: string[]
	popular?: boolean
	ctaText: string
	ctaLink: string
}

const PricingPage = () => {
	const pricingTiers: PricingTier[] = [
		{
			name: 'Job Seeker',
			price: 'Free',
			description: 'Perfect for individual job seekers looking for opportunities',
			features: [
				'Unlimited job applications',
				'Advanced job search filters',
				'Resume builder & templates',
				'Application tracking (Kanban board)',
				'Job alerts & notifications',
				'Company insights',
				'Mobile-friendly interface'
			],
			ctaText: 'Get Started Free',
			ctaLink: '/signup?type=candidate'
		},
		{
			name: 'Startup',
			price: '$99',
			description: 'Ideal for growing companies and startups',
			features: [
				'Up to 5 active job postings',
				'Basic ATS (Applicant Tracking System)',
				'Resume screening & filtering',
				'Email notifications',
				'Basic analytics dashboard',
				'Company profile management',
				'Standard support'
			],
			popular: true,
			ctaText: 'Start Free Trial',
			ctaLink: '/signup?type=company'
		},
		{
			name: 'Professional',
			price: '$299',
			description: 'For established companies with higher hiring needs',
			features: [
				'Up to 25 active job postings',
				'Advanced ATS with custom workflows',
				'AI-powered candidate matching',
				'Interview scheduling tools',
				'Advanced analytics & reporting',
				'Team collaboration features',
				'Priority support',
				'Custom branding options'
			],
			ctaText: 'Start Free Trial',
			ctaLink: '/signup?type=company'
		},
		{
			name: 'Enterprise',
			price: 'Custom',
			description: 'Tailored solutions for large organizations',
			features: [
				'Unlimited job postings',
				'Full-featured ATS with API access',
				'Advanced AI & machine learning',
				'Custom integrations',
				'Dedicated account manager',
				'White-label solutions',
				'24/7 premium support',
				'Custom training & onboarding'
			],
			ctaText: 'Contact Sales',
			ctaLink: '/contact'
		}
	]

	return (
		<div className="min-h-screen bg-gray-50 py-16">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="text-center mb-16">
					<h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
						Simple, Transparent Pricing
					</h1>
					<p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
						Choose the perfect plan for your needs. Start free and scale as you grow.
					</p>
				</div>

				{/* Pricing Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{pricingTiers.map((tier, index) => (
						<div
							key={index}
							className={`relative bg-white rounded-2xl shadow-lg ${
								tier.popular
									? 'ring-2 ring-blue-500 transform scale-105'
									: 'hover:shadow-xl'
							} transition-all duration-300`}
						>
							{tier.popular && (
								<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
									<span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
										Most Popular
									</span>
								</div>
							)}
							
							<div className="p-8">
								{/* Tier Header */}
								<div className="text-center mb-8">
									<h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
									<div className="mt-4">
										<span className="text-4xl font-bold text-gray-900">{tier.price}</span>
										{tier.price !== 'Free' && tier.price !== 'Custom' && (
											<span className="text-gray-500">/month</span>
										)}
									</div>
									<p className="mt-2 text-gray-600">{tier.description}</p>
								</div>

								{/* Features */}
								<ul className="space-y-4 mb-8">
									{tier.features.map((feature, featureIndex) => (
										<li key={featureIndex} className="flex items-start">
											<svg
												className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5 mr-3"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											<span className="text-gray-700">{feature}</span>
										</li>
									))}
								</ul>

								{/* CTA Button */}
								<Link
									href={tier.ctaLink}
									className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
										tier.popular
											? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
											: tier.name === 'Job Seeker'
											? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
											: 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg transform hover:-translate-y-0.5'
									}`}
								>
									{tier.ctaText}
								</Link>
							</div>
						</div>
					))}
				</div>

				{/* FAQ Section */}
				<div className="mt-20">
					<h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
						Frequently Asked Questions
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
						<div className="bg-white p-6 rounded-lg shadow-sm">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Can I change plans anytime?
							</h3>
							<p className="text-gray-600">
								Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
							</p>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-sm">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Is there a free trial?
							</h3>
							<p className="text-gray-600">
								All paid plans come with a 14-day free trial. No credit card required to start.
							</p>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-sm">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								What payment methods do you accept?
							</h3>
							<p className="text-gray-600">
								We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
							</p>
						</div>
						<div className="bg-white p-6 rounded-lg shadow-sm">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Do you offer refunds?
							</h3>
							<p className="text-gray-600">
								Yes, we offer a 30-day money-back guarantee for all paid plans.
							</p>
						</div>
					</div>
				</div>

				{/* Bottom CTA */}
				<div className="mt-16 text-center">
					<div className="bg-blue-600 rounded-2xl p-8 text-white">
						<h2 className="text-2xl font-bold mb-4">
							Ready to transform your hiring process?
						</h2>
						<p className="text-blue-100 mb-6">
							Join thousands of companies already using our platform to find the best talent.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								href="/signup?type=candidate"
								className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
							>
								Start as Job Seeker
							</Link>
							<Link
								href="/signup?type=company"
								className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors"
							>
								Start as Company
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default PricingPage
