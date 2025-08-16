"use client"

import { useState } from 'react'
import { signInWithGoogle, signOutUser } from '@/lib/auth/client'
import { useAuth } from '@/lib/auth/AuthProvider'

export function SignInButton() {
	const { user, loading } = useAuth()
	const [signingIn, setSigningIn] = useState(false)

	async function handleSignIn() {
		try {
			setSigningIn(true)
			await signInWithGoogle()
		} catch (error) {
			console.error('Sign in error:', error)
			alert('Error signing in. Check Firebase config.')
		} finally {
			setSigningIn(false)
		}
	}

	async function handleSignOut() {
		try {
			await signOutUser()
		} catch (error) {
			console.error('Sign out error:', error)
		}
	}

	if (loading) {
		return <div className="text-sm text-slate-600">Loading...</div>
	}

	if (user) {
		return (
			<div className="flex items-center gap-3">
				<span className="text-sm">{user.email}</span>
				<button onClick={handleSignOut} className="text-sm text-slate-600 hover:underline">
					Sign Out
				</button>
			</div>
		)
	}

	return (
		<button
			onClick={handleSignIn}
			disabled={signingIn}
			className="btn btn-primary text-sm"
		>
			{signingIn ? 'Signing in...' : 'Sign in with Google'}
		</button>
	)
}