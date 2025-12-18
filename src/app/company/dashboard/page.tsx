// Remove 'use client' from the main file since we need to export metadata
import { Metadata, Viewport } from 'next'
import CompanyDashboardClient from './CompanyDashboardClient'

export const metadata: Metadata = {
	title: 'Dashboard | HR Portal',
	description: 'Company dashboard and recruitment analytics',
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
}

const CompanyDashboard = () => {
	return <CompanyDashboardClient />
}

export default CompanyDashboard