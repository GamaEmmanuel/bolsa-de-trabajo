'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { getUserPreferences, getRedirectPath } from '../../lib/userPreferences'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react'

const SignUpPage = () => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isGoogleLoading, setIsGoogleLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()

	const redirectUser = async (user: any) => {
		try {
			const preferences = await getUserPreferences(user.uid)

			if (preferences) {
				// User has preferences, redirect to appropriate dashboard
				router.push(getRedirectPath(preferences))
			} else {
				// No preferences found, go to onboarding
				router.push('/onboarding')
			}
		} catch (error) {
			console.error('Error checking user preferences:', error)
			// Fallback to onboarding if there's an error
			router.push('/onboarding')
		}
	}

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setIsLoading(true)
		try {
			// Ensure persistence is set before signing up
			await setPersistence(auth, browserLocalPersistence)
			const userCredential = await createUserWithEmailAndPassword(auth, email, password)
			await redirectUser(userCredential.user)
		} catch (error) {
			setError((error as Error).message)
		} finally {
			setIsLoading(false)
		}
	}

	const handleGoogleSignIn = async () => {
		const provider = new GoogleAuthProvider()
		setIsGoogleLoading(true)
		try {
			// Ensure persistence is set before signing in
			await setPersistence(auth, browserLocalPersistence)
			const userCredential = await signInWithPopup(auth, provider)
			await redirectUser(userCredential.user)
		} catch (error) {
			setError((error as Error).message)
		} finally {
			setIsGoogleLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
				<div className="absolute top-40 left-1/2 w-60 h-60 bg-pink-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
			</div>
			<div className="relative w-full max-w-md">
				<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-6 sm:space-y-8">
					<div className="text-center space-y-2">
						<div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl sm:rounded-2xl mx-auto flex items-center justify-center shadow-lg">
							<User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
							Crear Cuenta
						</h1>
						<p className="text-sm sm:text-base text-gray-600">
							Comienza tu viaje con nosotros hoy
						</p>
					</div>
					<form onSubmit={handleSignUp} className="space-y-5 sm:space-y-6">
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
								<input
									type="email"
									placeholder="Ingresa tu correo electrónico"
									value={email}
									onChange={e => setEmail(e.target.value)}
									required
									className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-gray-700">Contraseña</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
								<input
									type={showPassword ? "text" : "password"}
									placeholder="Crea una contraseña segura"
									value={password}
									onChange={e => setPassword(e.target.value)}
									required
									className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
								>
									{showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
								</button>
							</div>
						</div>
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm">
								{error}
							</div>
						)}
						<button
							type="submit"
							disabled={isLoading}
							className="w-full bg-gradient-to-r from-pink-600 to-pink-700 text-white py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-pink-700 hover:to-pink-800 focus:ring-4 focus:ring-pink-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
						>
							{isLoading ? (
								<>
									<Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
									<span>Creando cuenta...</span>
								</>
							) : (
								<>
									<span>Crear Cuenta</span>
									<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
								</>
							)}
						</button>
					</form>
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-200" />
						</div>
						<div className="relative flex justify-center text-xs sm:text-sm">
							<span className="px-3 sm:px-4 bg-white text-gray-500 font-medium">O</span>
						</div>
					</div>
					<button
						onClick={handleGoogleSignIn}
						disabled={isGoogleLoading}
						className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 sm:space-x-3 shadow-sm"
					>
						{isGoogleLoading ? (
							<>
								<Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
								<span className="text-sm sm:text-base">Creando cuenta con Google...</span>
							</>
						) : (
							<>
								<svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24">
									<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
									<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
									<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
									<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
								</svg>
								<span className="text-sm sm:text-base">Continuar con Google</span>
							</>
						)}
					</button>
					<p className="text-center text-sm sm:text-base text-gray-600">
						¿Ya tienes una cuenta?{' '}
						<Link href="/signin" className="font-semibold text-pink-600 hover:text-pink-700 transition-colors">
							Iniciar sesión aquí
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

export default SignUpPage