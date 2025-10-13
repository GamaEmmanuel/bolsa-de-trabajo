'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db, storage } from '../../../lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { CompanySize, Industry } from '../../../../types'
import { COMPANY_SIZE_OPTIONS, INDUSTRY_OPTIONS, BENEFITS_OPTIONS, COMPANY_CULTURE_OPTIONS } from '../../../lib/constants'

interface CompanyData {
	companyName: string
	industry: string
	websiteUrl: string
	description: string
	razonSocial: string
	rfc: string
	logoUrl?: string
	email?: string
	phone?: string
	address?: string
	city?: string
	state?: string
	zipCode?: string
	country?: string
	companySize?: CompanySize
	benefits?: string[]
	companyCulture?: string[]
}

const CompanySettingsPage = () => {
	const [companyData, setCompanyData] = useState<CompanyData>({
		companyName: '',
		industry: '',
		websiteUrl: '',
		description: '',
		razonSocial: '',
		rfc: '',
		logoUrl: '',
		email: '',
		phone: '',
		address: '',
		city: '',
		state: '',
		zipCode: '',
		country: 'Mexico',
		companySize: '11-50',
		benefits: [],
		companyCulture: []
	})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [logoFile, setLogoFile] = useState<File | null>(null)
	const [logoPreview, setLogoPreview] = useState<string | null>(null)
	const router = useRouter()

	// Load existing company data
	useEffect(() => {
		const loadCompanyData = async () => {
			try {
				const user = auth.currentUser
				if (!user) {
					router.push('/signin')
					return
				}

				const userRef = doc(db, 'users', user.uid)
				const userDoc = await getDoc(userRef)

				if (userDoc.exists()) {
					const userData = userDoc.data()
					if (userData.companyData) {
						setCompanyData(prev => ({
							...prev,
							...userData.companyData
						}))
						if (userData.companyData.logoUrl) {
							setLogoPreview(userData.companyData.logoUrl)
						}
					}
				}
			} catch (error) {
				console.error('Error loading company data:', error)
				setError('Error al cargar los datos de la empresa')
			} finally {
				setLoading(false)
			}
		}

		loadCompanyData()
	}, [router])

	const handleInputChange = (field: keyof CompanyData, value: string) => {
		setCompanyData(prev => ({
			...prev,
			[field]: value
		}))
	}

	const handleArrayChange = (field: 'benefits' | 'companyCulture', value: string, checked: boolean) => {
		setCompanyData(prev => ({
			...prev,
			[field]: checked
				? [...(prev[field] || []), value]
				: (prev[field] || []).filter(item => item !== value)
		}))
	}

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0]
			setLogoFile(file)

			// Create preview
			const reader = new FileReader()
			reader.onload = (e) => {
				setLogoPreview(e.target?.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleSave = async () => {
		if (!auth.currentUser) {
			setError('Debes iniciar sesión para guardar la configuración')
			return
		}

		setSaving(true)
		setError(null)
		setSuccess(false)

		try {
			let logoUrl = companyData.logoUrl

			// Handle logo upload if a new file was selected
			if (logoFile) {
				try {
					// Delete old logo if it exists
					if (companyData.logoUrl) {
						const oldLogoRef = ref(storage, companyData.logoUrl)
						await deleteObject(oldLogoRef).catch(() => {
							// Ignore error if file doesn't exist
						})
					}

					// Upload new logo
					const logoRef = ref(storage, `company-logos/${auth.currentUser.uid}/${logoFile.name}`)
					const snapshot = await uploadBytes(logoRef, logoFile)
					logoUrl = await getDownloadURL(snapshot.ref)
				} catch (uploadError) {
					console.error('Error uploading logo:', uploadError)
					setError('Error al subir el logo. Por favor, inténtalo de nuevo.')
					setSaving(false)
					return
				}
			}

			// Update company data
			const updatedCompanyData = {
				...companyData,
				logoUrl,
				lastUpdated: new Date().toISOString()
			}

			// Save to Firestore
			const userRef = doc(db, 'users', auth.currentUser.uid)
			await updateDoc(userRef, {
				companyData: updatedCompanyData
			})

			setCompanyData(updatedCompanyData)
			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)

		} catch (error) {
			console.error('Error saving company data:', error)
			setError('Error al guardar la configuración. Por favor, inténtalo de nuevo.')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
						<p className="mt-2 text-gray-600">Cargando configuración de la empresa...</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-2">Configuración de la Empresa</h1>
				<p className="text-muted-foreground">Gestiona la información y preferencias de tu empresa</p>
			</div>

			{/* Success Message */}
			{success && (
				<div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm font-medium text-green-800">
								¡Configuración de la empresa guardada exitosamente!
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Error Message */}
			{error && (
				<div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm font-medium text-red-800">{error}</p>
						</div>
					</div>
				</div>
			)}

			<div className="bg-card rounded-lg border border-border">
				<div className="p-6">
					<form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">

						{/* Company Logo Section */}
						<div className="border-b border-border pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Logo de la Empresa</h2>
							<div className="flex items-center space-x-6">
								{logoPreview && (
									<div className="flex-shrink-0">
										<img
											src={logoPreview}
											alt="Logo de la empresa"
											className="h-20 w-20 rounded-lg object-cover border border-border"
										/>
									</div>
								)}
								<div className="flex-1">
									<label className="block text-sm font-medium text-foreground mb-2">
										Subir Logo
									</label>
									<input
										type="file"
										accept="image/*"
										onChange={handleLogoChange}
										className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
									/>
									<p className="mt-1 text-sm text-muted-foreground">
										PNG, JPG, GIF hasta 10MB. Tamaño recomendado: 200x200px
									</p>
								</div>
							</div>
						</div>

						{/* Basic Information */}
						<div className="border-b border-border pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Información Básica</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Nombre de la Empresa *
									</label>
									<input
										type="text"
										value={companyData.companyName}
										onChange={(e) => handleInputChange('companyName', e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Industria
									</label>
									<input
										type="text"
										value={companyData.industry}
										onChange={(e) => handleInputChange('industry', e.target.value)}
										placeholder="ej., Tecnología, Salud, Finanzas"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										URL del Sitio Web
									</label>
									<input
										type="url"
										value={companyData.websiteUrl}
										onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
										placeholder="https://www.company.com"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Correo Electrónico
									</label>
									<input
										type="email"
										value={companyData.email || ''}
										onChange={(e) => handleInputChange('email', e.target.value)}
										placeholder="contact@company.com"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Teléfono
									</label>
									<input
										type="tel"
										value={companyData.phone || ''}
										onChange={(e) => handleInputChange('phone', e.target.value)}
										placeholder="+52 55 1234 5678"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
							</div>
							<div className="mt-6">
									<label className="block text-sm font-medium text-foreground mb-2">
										Descripción de la Empresa
									</label>
								<textarea
									value={companyData.description}
									onChange={(e) => handleInputChange('description', e.target.value)}
									rows={4}
									placeholder="Cuéntanos sobre tu empresa..."
									className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								/>
							</div>
						</div>

						{/* Legal Information */}
						<div className="border-b border-border pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Información Legal</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Razón Social (Nombre Legal)
									</label>
									<input
										type="text"
										value={companyData.razonSocial}
										onChange={(e) => handleInputChange('razonSocial', e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										RFC (ID Fiscal)
									</label>
									<input
										type="text"
										value={companyData.rfc}
										onChange={(e) => handleInputChange('rfc', e.target.value)}
										placeholder="ABC123456789"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
							</div>
						</div>

						{/* Address Information */}
						<div className="border-b border-border pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Información de Dirección</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-foreground mb-2">
										Dirección
									</label>
									<input
										type="text"
										value={companyData.address || ''}
										onChange={(e) => handleInputChange('address', e.target.value)}
										placeholder="Calle Principal 123"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Ciudad
									</label>
									<input
										type="text"
										value={companyData.city || ''}
										onChange={(e) => handleInputChange('city', e.target.value)}
										placeholder="Ciudad de México"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Estado
									</label>
									<input
										type="text"
										value={companyData.state || ''}
										onChange={(e) => handleInputChange('state', e.target.value)}
										placeholder="CDMX"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Código Postal
									</label>
									<input
										type="text"
										value={companyData.zipCode || ''}
										onChange={(e) => handleInputChange('zipCode', e.target.value)}
										placeholder="01000"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										País
									</label>
									<select
										value={companyData.country || 'Mexico'}
										onChange={(e) => handleInputChange('country', e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									>
										<option value="Mexico">México</option>
										<option value="United States">Estados Unidos</option>
										<option value="Canada">Canadá</option>
										<option value="Other">Otro</option>
									</select>
								</div>
							</div>
						</div>

						{/* Company Profile */}
						<div className="border-b border-border pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Perfil de la Empresa</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Tamaño de la Empresa
									</label>
									<select
										value={companyData.companySize || '11-50'}
										onChange={(e) => handleInputChange('companySize', e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									>
										{COMPANY_SIZE_OPTIONS.map(option => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Industria
									</label>
									<select
										value={companyData.industry}
										onChange={(e) => handleInputChange('industry', e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									>
										<option value="">Selecciona una industria</option>
										{INDUSTRY_OPTIONS.map(option => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>

						{/* Benefits & Culture */}
						<div className="pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Beneficios y Cultura de la Empresa</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Beneficios (Selecciona todos los que apliquen)
									</label>
									<div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-border rounded-md p-3">
										{BENEFITS_OPTIONS.map(benefit => (
											<label key={benefit.value} className="flex items-center text-sm">
												<input
													type="checkbox"
													checked={companyData.benefits?.includes(benefit.value) || false}
													onChange={(e) => handleArrayChange('benefits', benefit.value, e.target.checked)}
													className="mr-2"
												/>
												{benefit.label}
											</label>
										))}
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Cultura de la Empresa (Selecciona todas las que apliquen)
									</label>
									<div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-border rounded-md p-3">
										{COMPANY_CULTURE_OPTIONS.map(culture => (
											<label key={culture.value} className="flex items-center text-sm">
												<input
													type="checkbox"
													checked={companyData.companyCulture?.includes(culture.value) || false}
													onChange={(e) => handleArrayChange('companyCulture', culture.value, e.target.checked)}
													className="mr-2"
												/>
												{culture.label}
											</label>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Save Button */}
						<div className="flex justify-end space-x-4">
							<button
								type="button"
								onClick={() => router.back()}
								className="px-6 py-2 text-muted-foreground bg-secondary border border-border rounded-md hover:bg-accent transition-colors"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={saving}
								className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{saving ? (
									<div className="flex items-center">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Guardando...
									</div>
								) : (
									'Guardar Cambios'
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default CompanySettingsPage