'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth, db, storage } from '../../../lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { CompanySize, Industry } from '../../../../types'
import { COMPANY_SIZE_OPTIONS, INDUSTRY_OPTIONS, BENEFITS_OPTIONS, COMPANY_CULTURE_OPTIONS } from '../../../lib/constants'
import EmailPreferences from '../../../components/EmailPreferences'
import { useAuth } from '../../../lib/authContext'

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
	// Social Media URLs
	instagramUrl?: string
	facebookUrl?: string
	googleMapsUrl?: string
	youtubeUrl?: string
	tiktokUrl?: string
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
	const [companyId, setCompanyId] = useState<string | null>(null)
	const [paymentSuccess, setPaymentSuccess] = useState(false)
	const router = useRouter()
	const searchParams = useSearchParams()
	const { user: authUser, loading: authLoading } = useAuth()

	// Check for payment success
	useEffect(() => {
		const payment = searchParams.get('payment')
		if (payment === 'success') {
			setPaymentSuccess(true)
			setTimeout(() => {
				setPaymentSuccess(false)
				router.replace('/company/settings')
			}, 10000)
		}
	}, [searchParams, router])

	// Load existing company data
	useEffect(() => {
		if (authLoading) return

		const loadCompanyData = async () => {
			try {
				const user = authUser
				if (!user) {
					router.push('/signin')
					return
				}

				const userRef = doc(db, 'users', user.uid)
				const userDoc = await getDoc(userRef)

				if (userDoc.exists()) {
					const userData = userDoc.data()

					// Get companyId for subscription display
					if (userData.companyId) {
						setCompanyId(userData.companyId)
					}

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
	}, [authUser, authLoading, router])

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

			// Validate file type
			const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
			if (!validTypes.includes(file.type)) {
				setError('Formato de archivo inválido. Por favor, sube una imagen JPG, PNG, GIF o WebP.')
				return
			}

			// Validate file size (max 2MB for better performance)
			const maxSize = 2 * 1024 * 1024 // 2MB
			if (file.size > maxSize) {
				setError('El archivo es demasiado grande. El tamaño máximo permitido es 2MB.')
				return
			}

			setError(null)
			setLogoFile(file)

			// Create preview and validate image dimensions
			const reader = new FileReader()
			reader.onload = (e) => {
				const result = e.target?.result as string
				setLogoPreview(result)

				// Validate image dimensions
				const img = new Image()
				img.onload = () => {
					const width = img.width
					const height = img.height
					const aspectRatio = width / height

					// Log dimensions for monitoring
					console.log(`📐 Logo dimensions: ${width}x${height}, aspect ratio: ${aspectRatio.toFixed(2)}`)

					// Warn if image is too small or too large
					if (width < 100 || height < 100) {
						setError('⚠️ La imagen es muy pequeña. Se recomienda al menos 200x200px para mejor calidad.')
					} else if (width > 2000 || height > 2000) {
						setError('⚠️ La imagen es muy grande. Se recomienda máximo 1000x1000px.')
					} else if (aspectRatio < 0.5 || aspectRatio > 2) {
						setError('⚠️ La proporción de la imagen no es ideal. Se recomienda usar imágenes cuadradas o cercanas a cuadradas.')
					} else {
						console.log('✅ Logo dimensions are optimal')
					}
				}
				img.onerror = () => {
					setError('Error al procesar la imagen. Por favor, intenta con otra.')
					setLogoFile(null)
					setLogoPreview(null)
				}
				img.src = result
			}
			reader.onerror = () => {
				setError('Error al leer el archivo. Por favor, intenta de nuevo.')
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

			// Save to Firestore - BOTH users and companies collections
			const userRef = doc(db, 'users', auth.currentUser.uid)
			await updateDoc(userRef, {
				companyData: updatedCompanyData
			})

			// Also save to companies collection (this is where job listings fetch from)
			if (companyId) {
				const companyRef = doc(db, 'companies', companyId)
				await updateDoc(companyRef, {
					logoUrl,
					lastUpdated: new Date().toISOString()
				}).catch(err => {
					console.error('Warning: Could not update companies collection:', err)
					// Don't fail the whole save if this fails
				})
			}

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
		<div className="min-h-screen bg-gray-50 p-4 md:p-8">
			<div className="max-w-4xl mx-auto bg-white p-4 md:p-8 rounded-lg shadow-md">
				<div className="mb-6 md:mb-8">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Configuración de la Empresa</h1>
					<p className="text-sm md:text-base text-gray-600">Gestiona la información y preferencias de tu empresa</p>
				</div>

				{/* Payment Success Message */}
				{paymentSuccess && (
					<div className="mb-6 bg-green-50 border-2 border-green-500 rounded-lg p-6 shadow-lg">
						<div className="flex items-start">
							<div className="flex-shrink-0">
								<svg className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
							</div>
							<div className="ml-4 flex-1">
								<h3 className="text-lg font-bold text-green-900 mb-1">
									¡Pago Exitoso! 🎉
								</h3>
								<p className="text-green-800">
									Tu pago se ha procesado correctamente.
								</p>
							</div>
						</div>
					</div>
				)}

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

				<div className="space-y-6 md:space-y-8">
					<form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6 md:space-y-8">

						{/* Company Logo Section */}
						<div className="bg-blue-50 p-4 md:p-6 rounded-lg">
							<h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Logo de la Empresa</h2>
							<div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0">
								{logoPreview && (
									<div className="flex-shrink-0">
										<img
											src={logoPreview}
											alt="Logo de la empresa"
											className="h-20 w-20 md:h-24 md:w-24 rounded-lg object-contain border border-gray-200 bg-gray-50 p-1"
										/>
									</div>
								)}
								<div className="flex-1 w-full">
									<label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
										Subir Logo
									</label>
									<input
										type="file"
										accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
										onChange={handleLogoChange}
										className="block w-full text-xs md:text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 md:file:px-4 file:rounded-md file:border-0 file:text-xs md:file:text-sm file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-700"
									/>
									<p className="mt-1 text-xs md:text-sm text-gray-500">
										PNG, JPG, GIF, WebP hasta 2MB. Tamaño recomendado: 200x200px - 500x500px (cuadrado o similar)
									</p>
								</div>
							</div>
						</div>

						{/* Basic Information */}
						<div className="bg-gray-50 p-4 md:p-6 rounded-lg">
							<h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Nombre de la Empresa *
									</label>
									<input
										type="text"
										value={companyData.companyName}
										onChange={(e) => handleInputChange('companyName', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										URL del Sitio Web
									</label>
									<input
										type="url"
										value={companyData.websiteUrl}
										onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
										placeholder="https://www.tu-empresa.com"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Correo Electrónico
									</label>
									<input
										type="email"
										value={companyData.email || ''}
										onChange={(e) => handleInputChange('email', e.target.value)}
										placeholder="contact@company.com"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Teléfono
									</label>
									<input
										type="tel"
										value={companyData.phone || ''}
										onChange={(e) => handleInputChange('phone', e.target.value)}
										placeholder="+52 55 1234 5678"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
							</div>
							<div className="mt-6">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Descripción de la Empresa
								</label>
								<textarea
									value={companyData.description}
									onChange={(e) => handleInputChange('description', e.target.value)}
									rows={4}
									placeholder="Cuéntanos sobre tu empresa..."
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
						</div>

						{/* Legal Information */}
						<div className="bg-green-50 p-4 md:p-6 rounded-lg">
							<h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Información Legal</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Razón Social (Nombre Legal)
									</label>
									<input
										type="text"
										value={companyData.razonSocial}
										onChange={(e) => handleInputChange('razonSocial', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										RFC (ID Fiscal)
									</label>
									<input
										type="text"
										value={companyData.rfc}
										onChange={(e) => handleInputChange('rfc', e.target.value)}
										placeholder="ABC123456789"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
							</div>
						</div>

						{/* Address Information */}
						<div className="bg-yellow-50 p-4 md:p-6 rounded-lg">
							<h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Información de Dirección</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Dirección
									</label>
									<input
										type="text"
										value={companyData.address || ''}
										onChange={(e) => handleInputChange('address', e.target.value)}
										placeholder="Calle Principal 123"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Ciudad
									</label>
									<input
										type="text"
										value={companyData.city || ''}
										onChange={(e) => handleInputChange('city', e.target.value)}
										placeholder="Ciudad de México"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Estado
									</label>
									<input
										type="text"
										value={companyData.state || ''}
										onChange={(e) => handleInputChange('state', e.target.value)}
										placeholder="CDMX"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Código Postal
									</label>
									<input
										type="text"
										value={companyData.zipCode || ''}
										onChange={(e) => handleInputChange('zipCode', e.target.value)}
										placeholder="01000"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										País
									</label>
									<select
										value={companyData.country || 'Mexico'}
										onChange={(e) => handleInputChange('country', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
						<div className="bg-indigo-50 p-4 md:p-6 rounded-lg">
							<h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Perfil de la Empresa</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Tamaño de la Empresa
									</label>
									<select
										value={companyData.companySize || '11-50'}
										onChange={(e) => handleInputChange('companySize', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										{COMPANY_SIZE_OPTIONS.map(option => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Tipo de Negocio *
									</label>
									<select
										value={companyData.industry}
										onChange={(e) => handleInputChange('industry', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									>
										<option value="">Selecciona el tipo de negocio</option>
										{INDUSTRY_OPTIONS.map(option => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>

						{/* Social Media Links */}
						<div className="bg-purple-50 p-4 md:p-6 rounded-lg">
							<h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Redes Sociales</h2>
							<p className="text-xs md:text-sm text-gray-600 mb-4">
								Agrega los enlaces a las redes sociales de tu negocio para que los candidatos puedan conocerte mejor.
							</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<span className="text-xl">📷</span>
											Instagram
										</div>
									</label>
									<input
										type="url"
										value={companyData.instagramUrl || ''}
										onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
										placeholder="https://instagram.com/tu-negocio"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<span className="text-xl">👍</span>
											Facebook
										</div>
									</label>
									<input
										type="url"
										value={companyData.facebookUrl || ''}
										onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
										placeholder="https://facebook.com/tu-negocio"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<span className="text-xl">📍</span>
											Google Maps
										</div>
									</label>
									<input
										type="url"
										value={companyData.googleMapsUrl || ''}
										onChange={(e) => handleInputChange('googleMapsUrl', e.target.value)}
										placeholder="https://maps.google.com/?cid=..."
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
									<p className="mt-1 text-xs text-gray-500">
										Enlace directo a tu ubicación en Google Maps
									</p>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<span className="text-xl">🎥</span>
											YouTube
										</div>
									</label>
									<input
										type="url"
										value={companyData.youtubeUrl || ''}
										onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
										placeholder="https://youtube.com/@tu-negocio"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<span className="text-xl">🎵</span>
											TikTok
										</div>
									</label>
									<input
										type="url"
										value={companyData.tiktokUrl || ''}
										onChange={(e) => handleInputChange('tiktokUrl', e.target.value)}
										placeholder="https://tiktok.com/@tu-negocio"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
							</div>
						</div>

						{/* Benefits & Culture */}
						<div className="bg-orange-50 p-4 md:p-6 rounded-lg">
							<h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Beneficios y Cultura de la Empresa</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-3">
										Beneficios (Selecciona todos los que apliquen)
									</label>
									<div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
										{BENEFITS_OPTIONS.map(benefit => (
											<label
												key={benefit.value}
												className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group min-h-[44px]"
											>
												<div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
													<input
														type="checkbox"
														checked={companyData.benefits?.includes(benefit.value) || false}
														onChange={(e) => handleArrayChange('benefits', benefit.value, e.target.checked)}
														className="peer sr-only"
													/>
													<div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-pink-600 peer-checked:bg-pink-600 transition-all duration-200 flex items-center justify-center group-hover:border-pink-400">
														<svg
															className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
														</svg>
													</div>
												</div>
												<span className="text-sm text-gray-700 select-none leading-relaxed">{benefit.label}</span>
											</label>
										))}
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-3">
										Cultura de la Empresa (Selecciona todas las que apliquen)
									</label>
									<div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
										{COMPANY_CULTURE_OPTIONS.map(culture => (
											<label
												key={culture.value}
												className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group min-h-[44px]"
											>
												<div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
													<input
														type="checkbox"
														checked={companyData.companyCulture?.includes(culture.value) || false}
														onChange={(e) => handleArrayChange('companyCulture', culture.value, e.target.checked)}
														className="peer sr-only"
													/>
													<div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-pink-600 peer-checked:bg-pink-600 transition-all duration-200 flex items-center justify-center group-hover:border-pink-400">
														<svg
															className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
														</svg>
													</div>
												</div>
												<span className="text-sm text-gray-700 select-none leading-relaxed">{culture.label}</span>
											</label>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Save Button */}
						<div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
							<button
								type="button"
								onClick={() => router.back()}
								className="px-6 md:px-8 py-2.5 md:py-3 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 font-semibold text-base md:text-lg transition-colors"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={saving}
								className="px-6 md:px-8 py-2.5 md:py-3 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-semibold text-base md:text-lg disabled:cursor-not-allowed transition-colors"
							>
								{saving ? (
									<div className="flex items-center justify-center">
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

				{/* Email Preferences Section */}
				<div className="mt-6">
					<EmailPreferences
						userId={auth.currentUser?.uid || ''}
						userType="company"
					/>
				</div>
			</div>
		</div>
	)
}

// Wrap in Suspense for useSearchParams
export default function CompanySettingsPageWrapper() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 p-8">
				<div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
							<p className="mt-2 text-gray-600">Cargando configuración...</p>
						</div>
					</div>
				</div>
			</div>
		}>
			<CompanySettingsPage />
		</Suspense>
	)
}