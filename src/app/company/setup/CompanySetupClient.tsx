'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db, storage } from '../../../lib/firebase'
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '../../../lib/authContext'

const steps = [
	'Bienvenida',
	'Detalles de la Empresa',
	'Información Fiscal',
	'Cargar Logo',
]

const CompanySetupClient = () => {
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
	const { user: authUser, loading: authLoading } = useAuth()

	// Check if user has already completed setup
	useEffect(() => {
		if (authLoading) return

		const checkSetupStatus = async () => {
			if (authUser) {
				try {
					const userRef = doc(db, 'users', authUser.uid)
					const userDoc = await getDoc(userRef)

					if (userDoc.exists()) {
						const userData = userDoc.data()
						if (userData.companySetupCompleted) {
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
	}, [authUser, authLoading, router])

	const handleNext = async () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1)
		} else {
			// Final step, save data and redirect
			try {
				const user = auth.currentUser
				if (user) {
					// Prepare company data for saving (exclude the File object)
					const companyId = user.uid // Use user UID as company ID for 1:1 relationship

					const companyDataToSave = {
						...companyData,
						companyId,
						createdAt: new Date().toISOString(),
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

					// 1. Create Company Document in 'companies' collection
					const companyRef = doc(db, 'companies', companyId)
					await setDoc(companyRef, companyDataToSave)

					// 2. Update user preferences to mark setup as completed and link companyId
					const userRef = doc(db, 'users', user.uid)
					await updateDoc(userRef, {
						companySetupCompleted: true,
						companyId: companyId, // Crucial for subscription/checkout
						companyData: companyDataToSave, // Keep for backward compatibility
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
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
					<p className="mt-2 text-gray-600">Cargando...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-8">
			<div className="w-full max-w-2xl bg-white p-6 sm:p-8 rounded-lg shadow-md">
				<h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">
					Configuración de Cuenta Empresarial
				</h2>
				<p className="text-center text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">{`Paso ${
					currentStep + 1
				} de ${steps.length}: ${steps[currentStep]}`}</p>

				{/* Step Content */}
				<div className="space-y-4">
					{currentStep === 0 && (
						<div className="text-center py-4">
							<div className="text-5xl sm:text-6xl mb-4">🏢</div>
							<h3 className="text-lg sm:text-xl font-semibold">
								¡Bienvenido a Trabajo Libre!
							</h3>
							<p className="mt-2 text-sm sm:text-base text-gray-600">
								Configuremos tu empresa. Esto solo tomará un par de minutos.
							</p>
						</div>
					)}
					{currentStep === 1 && (
						<>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Nombre de la Empresa *
								</label>
								<input
									type="text"
									placeholder="ej., Mi Empresa S.A."
									value={companyData.companyName}
									onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
									className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Industria *
								</label>
								<input
									type="text"
									placeholder="ej., Tecnología, Retail, Educación"
									value={companyData.industry}
									onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
									className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Sitio Web (Opcional)
								</label>
								<input
									type="url"
									placeholder="https://tu-empresa.com"
									value={companyData.websiteUrl}
									onChange={(e) => setCompanyData({ ...companyData, websiteUrl: e.target.value })}
									className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
								/>
							</div>
						</>
					)}
					{currentStep === 2 && (
						<>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Razón Social *
								</label>
								<input
									type="text"
									placeholder="Nombre legal de la empresa"
									value={companyData.razonSocial}
									onChange={(e) => setCompanyData({ ...companyData, razonSocial: e.target.value })}
									className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									RFC (Identificación Fiscal)
								</label>
								<input
									type="text"
									placeholder="RFC de la empresa"
									value={companyData.rfc}
									onChange={(e) => setCompanyData({ ...companyData, rfc: e.target.value })}
									className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
								/>
							</div>
						</>
					)}
					{currentStep === 3 && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Cargar Logo de la Empresa (Opcional)
							</label>
							<input
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
							/>
							{companyData.logo && (
								<p className="mt-2 text-xs sm:text-sm text-gray-600">
									Archivo seleccionado: {(companyData.logo as any).name}
								</p>
							)}
						</div>
					)}
				</div>

				{/* Navigation */}
				<div className="flex justify-between mt-6 sm:mt-8 gap-3">
					{currentStep > 0 && (
						<button
							onClick={handleBack}
							className="px-4 sm:px-6 py-2 text-sm sm:text-base text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
						>
							Atrás
						</button>
					)}
					<div className="flex-grow"></div>
					<button
						onClick={handleNext}
						className="px-4 sm:px-6 py-2 text-sm sm:text-base text-white bg-pink-600 rounded-md hover:bg-pink-700 transition-colors font-medium"
					>
						{currentStep === steps.length - 1 ? 'Finalizar Configuración' : 'Siguiente'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default CompanySetupClient