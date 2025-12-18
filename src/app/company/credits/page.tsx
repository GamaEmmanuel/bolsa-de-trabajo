// Remove 'use client' from the main file since we need to export metadata
import { Metadata, Viewport } from 'next'
import PurchaseCreditsClient from './PurchaseCreditsClient'

export const metadata: Metadata = {
	title: 'Buy Credits | HR Portal',
	description: 'Purchase credits to unlock more features',
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
}

const PurchaseCreditsPage = () => {
	return <PurchaseCreditsClient />
}

export default PurchaseCreditsPage