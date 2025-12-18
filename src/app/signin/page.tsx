// Remove 'use client' from the main file since we need to export metadata
import { Metadata, Viewport } from 'next'
import SignInClient from './SignInClient'

export const metadata: Metadata = {
	title: 'Sign In | HR Portal',
	description: 'Sign in to your account',
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
}

const SignInPage = () => {
	return <SignInClient />
}

export default SignInPage