'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { getUserPreferences, getRedirectPath } from '../../lib/userPreferences'

const SignUpPage = () => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
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
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password)
			await redirectUser(userCredential.user)
		} catch (error) {
			setError((error as Error).message)
		}
	}

	const handleGoogleSignIn = async () => {
		const provider = new GoogleAuthProvider()
		try {
			const userCredential = await signInWithPopup(auth, provider)
			await redirectUser(userCredential.user)
		} catch (error) {
			setError((error as Error).message)
		}
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-secondary">
			<div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-sm border border-border">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Create an Account</h1>
					<p className="text-muted-foreground">
						Start your journey with us today
					</p>
				</div>
				<form onSubmit={handleSignUp} className="space-y-4">
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
						className="w-full px-3 py-2 bg-input border border-border rounded-md focus:ring-2 focus:ring-primary"
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
						className="w-full px-3 py-2 bg-input border border-border rounded-md focus:ring-2 focus:ring-primary"
					/>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<button
						type="submit"
						className="w-full px-4 py-2 text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
					>
						Sign Up
					</button>
				</form>
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-border" />
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-2 bg-card text-muted-foreground">OR</span>
					</div>
				</div>
				<button
					onClick={handleGoogleSignIn}
					className="w-full px-4 py-2 text-foreground bg-secondary rounded-md hover:bg-secondary/80 border border-border"
				>
					Sign Up with Google
				</button>
				<p className="text-sm text-center text-muted-foreground">
					Already have an account?{' '}
					<Link href="/signin" className="font-medium text-primary hover:underline">
						Sign In
					</Link>
				</p>
			</div>
		</div>
	)
}

export default SignUpPage