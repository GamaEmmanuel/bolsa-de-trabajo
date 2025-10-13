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
							<div className="w-10 h-10 bg-orange-500 rounded-full mr-3 flex items-center justify-center">
								<svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M13 2L3 14h6v8l10-12h-6V2z"/>
								</svg>
							</div>
							<div className="flex flex-col">
								<span className="text-xl font-bold text-gray-900">TalentFlow</span>
								<span className="text-xs text-orange-500 font-semibold uppercase tracking-wide">CONTRATA, MÁS RÁPIDO</span>
							</div>
						</Link>
					</div>
					<div className="hidden md:flex items-center space-x-8">
						<Link href="/jobs" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
							Empleos
						</Link>
						<Link href="/contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
							Contacto
						</Link>
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
							className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
						>
							Comenzar
						</Link>
					</div>
				</div>
			</div>
		</nav>
	)
}

export default Header
