'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db, storage } from '../../../lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const steps = [
	'Welcome',
	'Company Details',
	'Fiscal Information',
	'Upload Logo',
]

const CompanySetupPage = () => {
	const [currentStep, setCurrentStep] = useState(0)
	const [companyData, setCompanyData] = useState({
		companyName: '',
		industry: '',
		websiteUrl: '',
		description: '',
		razonSocial: '',
		rfc: '',
		logo: null,
	})
	const [loading, setLoading] = useState(true)
	const router = useRouter()

	// Check if user has already completed setup
	useEffect(() => {
		const checkSetupStatus = async () => {
			const user = auth.currentUser
			if (user) {
				try {
					const userRef = doc(db, 'users', user.uid)
					const userDoc = await getDoc(userRef)

					if (userDoc.exists()) {
						const userData = userDoc.data()
						if (userData.companySetupCompleted) {
							// User has already completed setup, redirect to dashboard
							router.push('/company/dashboard')
							return
						}
					}
				} catch (error) {
					console.error('Error checking setup status:', error)
				}
			}
			setLoading(false)
		}

		checkSetupStatus()
	}, [router])

	const handleNext = async () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1)
		} else {
			// Final step, save data and redirect
			try {
				const user = auth.currentUser
				if (user) {
					// Prepare company data for saving (exclude the File object)
					const companyDataToSave = {
						...companyData,
						logo: null // We'll handle the logo separately
					}

					// Upload logo to Firebase Storage if it exists
					let logoUrl = null
					if (companyData.logo) {
						try {
							const logoRef = ref(storage, `company-logos/${user.uid}/${companyData.logo.name}`)
							const snapshot = await uploadBytes(logoRef, companyData.logo)
							logoUrl = await getDownloadURL(snapshot.ref)
							companyDataToSave.logoUrl = logoUrl
						} catch (uploadError) {
							console.error('Error uploading logo:', uploadError)
							// Continue without logo if upload fails
						}
					}

					// Update user preferences to mark setup as completed
					const userRef = doc(db, 'users', user.uid)
					await updateDoc(userRef, {
						companySetupCompleted: true,
						companyData: companyDataToSave,
						lastUpdated: new Date().toISOString()
					})
					console.log('Company setup completed successfully')
					router.push('/company/dashboard')
				} else {
					console.error('No authenticated user found')
					router.push('/signin')
				}
			} catch (error) {
				console.error('Error completing company setup:', error)
				// Still redirect to dashboard even if there's an error
				router.push('/company/dashboard')
			}
		}
	}

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1)
		}
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setCompanyData({ ...companyData, logo: e.target.files[0] as any })
		}
	}

	// Show loading state while checking setup status
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<p className="mt-2 text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
			<div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
				<h2 className="text-2xl font-bold mb-2 text-center">
					Company Account Setup
				</h2>
				<p className="text-center text-gray-500 mb-8">{`Step ${
					currentStep + 1
				} of ${steps.length}: ${steps[currentStep]}`}</p>

				{/* Step Content */}
				<div className="space-y-4">
					{currentStep === 0 && (
						<div className="text-center">
							<h3 className="text-xl font-semibold">
								Welcome to the HR Portal!
							</h3>
							<p className="mt-2 text-gray-600">
								Let's get your company set up. This will only take a couple of
								minutes.
							</p>
						</div>
					)}
					{currentStep === 1 && (
						<>
							<input
								type="text"
								placeholder="Company Name"
								value={companyData.companyName}
								onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
								className="w-full px-3 py-2 border rounded-md"
							/>
							<input
								type="text"
								placeholder="Industry (e.g., Technology)"
								value={companyData.industry}
								onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
								className="w-full px-3 py-2 border rounded-md"
							/>
							<input
								type="url"
								placeholder="Website URL"
								value={companyData.websiteUrl}
								onChange={(e) => setCompanyData({ ...companyData, websiteUrl: e.target.value })}
								className="w-full px-3 py-2 border rounded-md"
							/>
						</>
					)}
					{currentStep === 2 && (
						<>
							<input
								type="text"
								placeholder="Razón Social (Legal Name)"
								value={companyData.razonSocial}
								onChange={(e) => setCompanyData({ ...companyData, razonSocial: e.target.value })}
								className="w-full px-3 py-2 border rounded-md"
							/>
							<input
								type="text"
								placeholder="RFC (Tax ID)"
								value={companyData.rfc}
								onChange={(e) => setCompanyData({ ...companyData, rfc: e.target.value })}
								className="w-full px-3 py-2 border rounded-md"
							/>
						</>
					)}
					{currentStep === 3 && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Upload Company Logo
							</label>
							<input
								type="file"
								onChange={handleFileChange}
								className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
						</div>
					)}
				</div>

				{/* Navigation */}
				<div className="flex justify-between mt-8">
					{currentStep > 0 && (
						<button
							onClick={handleBack}
							className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
						>
							Back
						</button>
					)}
					<div className="flex-grow"></div>
					<button
						onClick={handleNext}
						className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
					>
						{currentStep === steps.length - 1 ? 'Finish Setup' : 'Next'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default CompanySetupPage