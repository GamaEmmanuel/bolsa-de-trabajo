// Remove 'use client' from the main file since we need to export metadata
import { Metadata, Viewport } from 'next'
import CompanySetupClient from './CompanySetupClient'

export const metadata: Metadata = {
	title: 'Setup Company | HR Portal',
	description: 'Set up your company profile',
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
}

const CompanySetupPage = () => {
	return <CompanySetupClient />
}

export default CompanySetupPage