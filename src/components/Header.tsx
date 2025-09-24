'use client'

import React from 'react'
import Link from 'next/link'

const Header = () => {
	return (
		<nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
			<div className="max-w-6xl mx-auto px-6">
				<div className="flex justify-between items-center py-4">
					<div className="flex items-center">
						<Link href="/" className="flex items-center">
							<div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3 flex items-center justify-center">
								<span className="text-white font-bold text-sm">T</span>
							</div>
							<span className="text-xl font-bold text-gray-900">TalentFlow</span>
						</Link>
					</div>
					<div className="hidden md:flex items-center space-x-8">
						<Link href="/jobs" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
							Jobs
						</Link>
						<Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
							Pricing
						</Link>
						<Link href="/contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
							Contact
						</Link>
					</div>
					<div className="flex items-center space-x-3">
						<Link
							href="/signin"
							className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2 transition-colors"
						>
							Sign In
						</Link>
						<Link
							href="/signup"
							className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
						>
							Get Started
						</Link>
					</div>
				</div>
			</div>
		</nav>
	)
}

export default Header
