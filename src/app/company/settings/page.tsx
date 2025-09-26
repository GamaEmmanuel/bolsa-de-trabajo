'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db, storage } from '../../../lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

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
		country: 'Mexico'
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
				setError('Failed to load company data')
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
			setError('You must be signed in to save settings')
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
					setError('Failed to upload logo. Please try again.')
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
			setError('Failed to save settings. Please try again.')
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
						<p className="mt-2 text-gray-600">Loading company settings...</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-2">Company Settings</h1>
				<p className="text-muted-foreground">Manage your company information and preferences</p>
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
								Company settings saved successfully!
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
							<h2 className="text-xl font-semibold text-foreground mb-4">Company Logo</h2>
							<div className="flex items-center space-x-6">
								{logoPreview && (
									<div className="flex-shrink-0">
										<img
											src={logoPreview}
											alt="Company logo"
											className="h-20 w-20 rounded-lg object-cover border border-border"
										/>
									</div>
								)}
								<div className="flex-1">
									<label className="block text-sm font-medium text-foreground mb-2">
										Upload Logo
									</label>
									<input
										type="file"
										accept="image/*"
										onChange={handleLogoChange}
										className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
									/>
									<p className="mt-1 text-sm text-muted-foreground">
										PNG, JPG, GIF up to 10MB. Recommended size: 200x200px
									</p>
								</div>
							</div>
						</div>

						{/* Basic Information */}
						<div className="border-b border-border pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Basic Information</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Company Name *
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
										Industry
									</label>
									<input
										type="text"
										value={companyData.industry}
										onChange={(e) => handleInputChange('industry', e.target.value)}
										placeholder="e.g., Technology, Healthcare, Finance"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Website URL
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
										Email
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
										Phone
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
									Company Description
								</label>
								<textarea
									value={companyData.description}
									onChange={(e) => handleInputChange('description', e.target.value)}
									rows={4}
									placeholder="Tell us about your company..."
									className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								/>
							</div>
						</div>

						{/* Legal Information */}
						<div className="border-b border-border pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Legal Information</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Razón Social (Legal Name)
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
										RFC (Tax ID)
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
						<div className="pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Address Information</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-foreground mb-2">
										Street Address
									</label>
									<input
										type="text"
										value={companyData.address || ''}
										onChange={(e) => handleInputChange('address', e.target.value)}
										placeholder="123 Main Street"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										City
									</label>
									<input
										type="text"
										value={companyData.city || ''}
										onChange={(e) => handleInputChange('city', e.target.value)}
										placeholder="Mexico City"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										State
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
										ZIP Code
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
										Country
									</label>
									<select
										value={companyData.country || 'Mexico'}
										onChange={(e) => handleInputChange('country', e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									>
										<option value="Mexico">Mexico</option>
										<option value="United States">United States</option>
										<option value="Canada">Canada</option>
										<option value="Other">Other</option>
									</select>
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
								Cancel
							</button>
							<button
								type="submit"
								disabled={saving}
								className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{saving ? (
									<div className="flex items-center">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Saving...
									</div>
								) : (
									'Save Changes'
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