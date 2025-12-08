'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { db, auth, storage } from '../../../lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateEmail } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import LocationSelector from '../../../components/ui/LocationSelector'
import EmailPreferences from '../../../components/EmailPreferences'

interface UserAccount {
	userId: string
	email: string
	displayName: string
	firstName: string
	lastName: string
	dateOfBirth?: string
	phone?: string
	location?: string
	profilePictureUrl?: string
	preferences: {
		emailNotifications: boolean
		smsNotifications: boolean
		jobAlerts: boolean
		privacyLevel: 'public' | 'private' | 'limited'
	}
}

const AccountPage = () => {
	const [account, setAccount] = useState<UserAccount>({
		userId: '',
		email: '',
		displayName: '',
		firstName: '',
		lastName: '',
		dateOfBirth: '',
		phone: '',
		location: '',
		profilePictureUrl: '',
		preferences: {
			emailNotifications: true,
			smsNotifications: false,
			jobAlerts: true,
			privacyLevel: 'limited',
		},
	})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [user, setUser] = useState(auth.currentUser)
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})
	const [showPasswordForm, setShowPasswordForm] = useState(false)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [imagePreview, setImagePreview] = useState<string | null>(null)
	const [showCameraModal, setShowCameraModal] = useState(false)
	const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
	const [cameraVideoRef, setCameraVideoRef] = useState<HTMLVideoElement | null>(null)
	const [capturedImage, setCapturedImage] = useState<string | null>(null)
	const [showUploadModal, setShowUploadModal] = useState(false)
	const [imageLoadError, setImageLoadError] = useState(false)

	// Debounce timer for auto-save
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Fetch user account data
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser)
			if (currentUser) {
				try {
					const accountRef = doc(db, 'userAccounts', currentUser.uid)
					console.log('Loading account data from userAccounts collection for user:', currentUser.uid)
					const accountDoc = await getDoc(accountRef)

					if (accountDoc.exists()) {
						const accountData = accountDoc.data() as UserAccount
						console.log('Found existing account data:', accountData)
						setAccount(accountData)
					} else {
						console.log('No existing account data found, initializing with user data')
						// Initialize with user data
						setAccount(prev => ({
							...prev,
							userId: currentUser.uid,
							email: currentUser.email || '',
							displayName: currentUser.displayName || '',
						}))
					}
				} catch (error) {
					console.error('Error fetching account:', error)
					setError('Error al cargar la información de la cuenta')
				} finally {
					setLoading(false)
				}
			} else {
				setLoading(false)
			}
		})

		return () => unsubscribeAuth()
	}, [])

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current)
			}
		}
	}, [])

	// Reset image load error when profile picture URL changes
	useEffect(() => {
		if (account.profilePictureUrl || imagePreview) {
			console.log('Profile picture URL changed:', { profilePictureUrl: account.profilePictureUrl, imagePreview, imageLoadError })
			setImageLoadError(false)
		}
	}, [account.profilePictureUrl, imagePreview])

	const handleInputChange = (field: keyof UserAccount, value: any) => {
		setAccount(prev => ({ ...prev, [field]: value }))

		// Auto-save certain fields with debouncing
		if (user && (field === 'phone' || field === 'location' || field === 'firstName' || field === 'lastName' || field === 'dateOfBirth')) {
			// Clear existing timeout
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current)
			}

			// Set new timeout for auto-save
			saveTimeoutRef.current = setTimeout(async () => {
				try {
					const accountRef = doc(db, 'userAccounts', user.uid)
					const updatedAccount = {
						...account,
						[field]: value,
						userId: user.uid
					}

					console.log('Auto-saving field change:', field, value)
					await setDoc(accountRef, updatedAccount, { merge: true })
					console.log('Field saved successfully to userAccounts collection')
				} catch (error) {
					console.error('Error auto-saving field:', error)
					setError('Error al guardar la información')
				}
			}, 1000) // 1 second delay
		}
	}

	const handlePreferenceChange = async (field: keyof UserAccount['preferences'], value: any) => {
		setAccount(prev => ({
			...prev,
			preferences: { ...prev.preferences, [field]: value }
		}))

		// Auto-save preferences immediately
		if (user) {
			try {
				const accountRef = doc(db, 'userAccounts', user.uid)
				const updatedAccount = {
					...account,
					preferences: { ...account.preferences, [field]: value },
					userId: user.uid
				}

				console.log('Auto-saving preference change:', field, value)
				await setDoc(accountRef, updatedAccount, { merge: true })
				console.log('Preference saved successfully to userAccounts collection')
			} catch (error) {
				console.error('Error auto-saving preference:', error)
				setError('Error al guardar la preferencia')
			}
		}
	}

	const handleSave = async () => {
		if (!user) return

		setSaving(true)
		setError(null)
		setSuccess(false)

		try {
			// Update Firebase Auth profile
			await updateProfile(user, {
				displayName: `${account.firstName} ${account.lastName}`.trim(),
			})

			// Update Firestore account data
			const accountRef = doc(db, 'userAccounts', user.uid)
			const accountData = { ...account, userId: user.uid }

			console.log('Saving account data to userAccounts collection:', accountData)
			await setDoc(accountRef, accountData, { merge: true })

			console.log('Account data saved successfully to userAccounts collection')
			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
		} catch (error) {
			console.error('Error saving account:', error)
			setError('Error al guardar la información de la cuenta')
		} finally {
			setSaving(false)
		}
	}

	const handlePasswordChange = async () => {
		if (!user) return

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setError('New passwords do not match')
			return
		}

		if (passwordForm.newPassword.length < 6) {
			setError('Password must be at least 6 characters long')
			return
		}

		setSaving(true)
		setError(null)

		try {
			// Re-authenticate user before changing password
			const credential = EmailAuthProvider.credential(
				user.email!,
				passwordForm.currentPassword
			)
			await reauthenticateWithCredential(user, credential)

			// Update password
			await updatePassword(user, passwordForm.newPassword)

			setPasswordForm({
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			})
			setShowPasswordForm(false)
			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
		} catch (error: any) {
			console.error('Error changing password:', error)
			if (error.code === 'auth/wrong-password') {
				setError('Current password is incorrect')
			} else if (error.code === 'auth/weak-password') {
				setError('New password is too weak')
			} else {
				setError('Failed to change password')
			}
		} finally {
			setSaving(false)
		}
	}

	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file || !user) return

		// Validate file type
		if (!file.type.startsWith('image/')) {
			setError('Please select a valid image file')
			return
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			setError('Image size must be less than 5MB')
			return
		}

		setUploadingImage(true)
		setError(null)

		try {
			// Create a unique filename with timestamp
			const fileExtension = file.name.split('.').pop()
			const timestamp = Date.now()
			const fileName = `profile-pictures/${user.uid}/profile-${timestamp}.${fileExtension}`

			// Upload to Firebase Storage
			const storageRef = ref(storage, fileName)
			await uploadBytes(storageRef, file)

			// Get download URL
			const downloadURL = await getDownloadURL(storageRef)

			console.log('Image uploaded, download URL:', downloadURL)

			// Delete old profile picture if it exists
			if (account.profilePictureUrl) {
				try {
					const oldImageRef = ref(storage, account.profilePictureUrl)
					await deleteObject(oldImageRef)
					console.log('Old profile picture deleted')
				} catch (deleteError) {
					console.log('Could not delete old profile picture:', deleteError)
					// Continue anyway - the new image was uploaded successfully
				}
			}

			// Create updated account object
			const updatedAccount = {
				...account,
				profilePictureUrl: downloadURL,
				userId: user.uid
			}

			// Update account state
			setAccount(updatedAccount)

			// Auto-save to Firestore
			const accountRef = doc(db, 'userAccounts', user.uid)
			await setDoc(accountRef, updatedAccount, { merge: true })

			// Update Firebase Auth profile
			await updateProfile(user, {
				photoURL: downloadURL
			})

			// Clear image preview after successful upload
			setImagePreview(null)

			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
		} catch (error) {
			console.error('Error uploading image:', error)
			setError('Failed to upload image. Please try again.')
			setImagePreview(null)
		} finally {
			setUploadingImage(false)
		}
	}

	const handleRemoveImage = async () => {
		if (!user || !account.profilePictureUrl) return

		setUploadingImage(true)
		setError(null)

		try {
			// Delete from Firebase Storage
			const imageRef = ref(storage, account.profilePictureUrl)
			await deleteObject(imageRef)

			// Create updated account object
			const updatedAccount = {
				...account,
				profilePictureUrl: '',
				userId: user.uid
			}

			// Update account state
			setAccount(updatedAccount)
			setImagePreview(null)

			// Update Firestore
			const accountRef = doc(db, 'userAccounts', user.uid)
			await setDoc(accountRef, updatedAccount, { merge: true })

			// Update Firebase Auth profile
			await updateProfile(user, {
				photoURL: null
			})

			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
		} catch (error) {
			console.error('Error removing image:', error)
			setError('Failed to remove image. Please try again.')
		} finally {
			setUploadingImage(false)
		}
	}

	const startCamera = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'user', // Front camera
					width: { ideal: 640 },
					height: { ideal: 640 }
				}
			})
			setCameraStream(stream)
			setShowCameraModal(true)
		} catch (error) {
			console.error('Error accessing camera:', error)
			setError('Unable to access camera. Please check permissions.')
		}
	}

	const stopCamera = () => {
		if (cameraStream) {
			cameraStream.getTracks().forEach(track => track.stop())
			setCameraStream(null)
		}
		setShowCameraModal(false)
		setCapturedImage(null)
	}

	const capturePhoto = () => {
		console.log('capturePhoto called, cameraVideoRef:', cameraVideoRef)
		if (cameraVideoRef) {
			const canvas = document.createElement('canvas')
			const context = canvas.getContext('2d')

			canvas.width = cameraVideoRef.videoWidth
			canvas.height = cameraVideoRef.videoHeight

			console.log('Canvas dimensions:', canvas.width, canvas.height)

			if (context) {
				try {
					context.drawImage(cameraVideoRef, 0, 0)
					console.log('Image drawn to canvas')
					const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
					console.log('Image converted to dataURL, length:', imageDataUrl.length)
					console.log('About to setCapturedImage')
					setCapturedImage(imageDataUrl)

					// Stop camera stream but don't clear capturedImage
					if (cameraStream) {
						cameraStream.getTracks().forEach(track => track.stop())
						setCameraStream(null)
					}
					setShowCameraModal(false)

					console.log('Capture complete')
				} catch (error) {
					console.error('Error capturing photo:', error)
					setError('Error al capturar la foto')
				}
			} else {
				console.error('No canvas context available')
			}
		} else {
			console.error('No cameraVideoRef available')
		}
	}

	const useCapturedPhoto = async () => {
		console.log('useCapturedPhoto called, capturedImage:', capturedImage?.substring(0, 50), 'user:', user?.uid)
		if (!capturedImage || !user) {
			console.log('Missing capturedImage or user, returning')
			return
		}

		setUploadingImage(true)
		setError(null)

		console.log('Starting upload process...')

		try {
			// Convert data URL to blob
			const response = await fetch(capturedImage)
			const blob = await response.blob()

			// Create a file from the blob
			const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })

			// Create a unique filename with timestamp
			const timestamp = Date.now()
			const fileName = `profile-pictures/${user.uid}/profile-${timestamp}.jpg`

			// Upload to Firebase Storage
			const storageRef = ref(storage, fileName)
			await uploadBytes(storageRef, file)

			// Get download URL
			const downloadURL = await getDownloadURL(storageRef)

			console.log('Captured photo uploaded, download URL:', downloadURL)

			// Delete old profile picture if it exists
			if (account.profilePictureUrl) {
				try {
					const oldImageRef = ref(storage, account.profilePictureUrl)
					await deleteObject(oldImageRef)
					console.log('Old profile picture deleted')
				} catch (deleteError) {
					console.log('Could not delete old profile picture:', deleteError)
					// Continue anyway - the new image was uploaded successfully
				}
			}

			// Create updated account object
			const updatedAccount = {
				...account,
				profilePictureUrl: downloadURL,
				userId: user.uid
			}

			// Update account state
			setAccount(updatedAccount)

			// Auto-save to Firestore
			const accountRef = doc(db, 'userAccounts', user.uid)
			await setDoc(accountRef, updatedAccount, { merge: true })

			// Update Firebase Auth profile
			await updateProfile(user, {
				photoURL: downloadURL
			})

			// Clear preview states after successful upload
			setCapturedImage(null)
			setImagePreview(null)

			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
		} catch (error) {
			console.error('Error uploading captured image:', error)
			setError('Failed to upload captured image. Please try again.')
			setCapturedImage(null)
		} finally {
			setUploadingImage(false)
		}
	}

	const discardCapturedPhoto = () => {
		console.log('Discarding captured photo')
		setCapturedImage(null)
	}

	// Track capturedImage changes
	useEffect(() => {
		console.log('capturedImage changed:', capturedImage ? 'Image captured' : 'No image')
	}, [capturedImage])

	// Track profile picture URL changes
	useEffect(() => {
		console.log('account.profilePictureUrl changed:', account.profilePictureUrl)
	}, [account.profilePictureUrl])

	// Connect camera stream to video element
	useEffect(() => {
		if (cameraStream && cameraVideoRef) {
			cameraVideoRef.srcObject = cameraStream
		}
	}, [cameraStream, cameraVideoRef])

	// Cleanup camera stream on unmount
	useEffect(() => {
		return () => {
			if (cameraStream) {
				cameraStream.getTracks().forEach(track => track.stop())
			}
		}
	}, [cameraStream])

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
				<p className="ml-2 text-gray-600">Cargando cuenta...</p>
			</div>
		)
	}

	return (
		<div className="max-w-4xl mx-auto space-y-4 py-4">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Configuración de Cuenta</h1>
				<p className="text-gray-600 text-sm mt-1">Gestiona la información de tu cuenta y preferencias</p>
			</div>

			{/* Success/Error Messages */}
			{success && (
				<div className="p-3 bg-green-50 border border-green-200 rounded-md">
					<p className="text-green-600 text-sm">¡Cuenta actualizada exitosamente!</p>
				</div>
			)}
			{error && (
				<div className="p-3 bg-red-50 border border-red-200 rounded-md">
					<p className="text-red-600 text-sm">{error}</p>
				</div>
			)}

			{/* Personal Information */}
			<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-lg font-semibold text-gray-900 mb-3">Información Personal</h2>

				{/* Profile Picture and All Fields Section */}
				<div className="flex items-start space-x-4">
					{/* Profile Picture - Clickable */}
					<div
						className="flex flex-col items-center cursor-pointer group flex-shrink-0"
						onClick={() => !uploadingImage && setShowUploadModal(true)}
					>
						<div className="relative w-20 h-20">
							{(account.profilePictureUrl || imagePreview) && !imageLoadError ? (
								<div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 group-hover:border-blue-500 transition-colors">
									<Image
										key={imagePreview || account.profilePictureUrl}
										src={imagePreview || account.profilePictureUrl}
										alt="Profile"
										width={80}
										height={80}
										className="object-cover"
										onLoad={() => {
											console.log('Image loaded successfully:', imagePreview || account.profilePictureUrl)
											setImageLoadError(false)
										}}
										onError={() => {
											console.error('Image failed to load:', imagePreview || account.profilePictureUrl)
											setImageLoadError(true)
										}}
										unoptimized
									/>
								</div>
							) : (
								<div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-300 group-hover:border-blue-500 transition-colors">
									{/* User initials when no photo */}
									<span className="text-2xl font-bold text-white">
										{account.firstName && account.lastName
											? `${account.firstName.charAt(0).toUpperCase()}${account.lastName.charAt(0).toUpperCase()}`
											: 'U'}
									</span>
								</div>
							)}
							{uploadingImage && (
								<div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center z-20">
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
								</div>
							)}
						</div>
						<p className="text-xs text-gray-500 mt-1 text-center">Foto de Perfil</p>
					</div>

					{/* All form fields to the right */}
					<div className="flex-1 space-y-3">
						{/* Name fields */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
								<input
									type="text"
									value={account.firstName}
									onChange={(e) => handleInputChange('firstName', e.target.value)}
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
								<input
									type="text"
									value={account.lastName}
									onChange={(e) => handleInputChange('lastName', e.target.value)}
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						</div>

						{/* Date of Birth and Phone */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
								<input
									type="date"
									value={account.dateOfBirth || ''}
									onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									max={new Date().toISOString().split('T')[0]}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
								<input
									type="tel"
									value={account.phone || ''}
									onChange={(e) => handleInputChange('phone', e.target.value)}
									className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						</div>

						{/* Email */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
							<input
								type="email"
								value={account.email}
								disabled
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-500"
							/>
							<p className="text-xs text-gray-500 mt-0.5">El correo electrónico no se puede cambiar</p>
						</div>

						{/* Location */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
							<LocationSelector
								value={account.location || ''}
								onChange={(locationData) => {
									if (locationData) {
										const locationString = locationData.city + (locationData.state ? `, ${locationData.state}` : '')
										handleInputChange('location', locationString)
									} else {
										handleInputChange('location', '')
									}
								}}
								placeholder="Selecciona tu ciudad"
								className="w-full"
							/>
						</div>
					</div>
				</div>

				{/* Hidden file input */}
				<input
					type="file"
					accept="image/*"
					onChange={handleImageUpload}
					disabled={uploadingImage}
					className="hidden"
					id="profile-picture-upload"
				/>
			</div>

			{/* Security */}
			<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-lg font-semibold text-gray-900 mb-3">Seguridad</h2>

				{!showPasswordForm ? (
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-medium text-gray-900">Contraseña</h3>
							<p className="text-sm text-gray-500">Último cambio: Nunca</p>
						</div>
						<button
							onClick={() => setShowPasswordForm(true)}
							className="px-4 py-2 text-sm bg-pink-600 text-white rounded-md hover:bg-pink-700"
						>
							Cambiar Contraseña
						</button>
					</div>
				) : (
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">Cambiar Contraseña</h3>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual</label>
							<input
								type="password"
								value={passwordForm.currentPassword}
								onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
							<input
								type="password"
								value={passwordForm.newPassword}
								onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña</label>
							<input
								type="password"
								value={passwordForm.confirmPassword}
								onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div className="flex space-x-3">
							<button
								onClick={handlePasswordChange}
								disabled={saving}
								className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-blue-400"
							>
								{saving ? 'Actualizando...' : 'Actualizar Contraseña'}
							</button>
							<button
								onClick={() => {
									setShowPasswordForm(false)
									setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
									setError(null)
								}}
								className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
							>
								Cancelar
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Preferences */}
			<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-lg font-semibold text-gray-900 mb-3">Preferencias de Notificación</h2>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-medium text-gray-900">Notificaciones por Correo</h3>
							<p className="text-sm text-gray-500">Recibe actualizaciones por correo electrónico</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={account.preferences.emailNotifications}
								onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
						</label>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-medium text-gray-900">Notificaciones por SMS</h3>
							<p className="text-sm text-gray-500">Recibe actualizaciones por SMS</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={account.preferences.smsNotifications}
								onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
						</label>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-medium text-gray-900">Alertas de Empleo</h3>
							<p className="text-sm text-gray-500">Recibe notificaciones sobre nuevas oportunidades de empleo</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={account.preferences.jobAlerts}
								onChange={(e) => handlePreferenceChange('jobAlerts', e.target.checked)}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
						</label>
					</div>
				</div>
			</div>

			{/* Privacy */}
			<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-lg font-semibold text-gray-900 mb-3">Configuración de Privacidad</h2>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Visibilidad del Perfil</label>
					<select
						value={account.preferences.privacyLevel}
						onChange={(e) => handlePreferenceChange('privacyLevel', e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="public">Público - Cualquiera puede ver mi perfil</option>
						<option value="limited">Limitado - Solo los empleadores a los que aplico pueden ver mi perfil</option>
						<option value="private">Privado - Solo yo puedo ver mi perfil</option>
					</select>
					<p className="text-xs text-gray-500 mt-1">
						La visibilidad de tu perfil afecta cómo los empleadores pueden encontrar y ver tu información.
					</p>
				</div>
			</div>

			{/* Save Button */}
			<div className="flex justify-end pb-4">
				<button
					onClick={handleSave}
					disabled={saving}
					className="px-5 py-2 text-sm bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-blue-400"
				>
					{saving ? 'Guardando...' : 'Guardar Cambios'}
				</button>
			</div>

			{/* Upload Photo Modal */}
			{showUploadModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
						<div className="flex justify-between items-center mb-6">
							<h3 className="text-2xl font-semibold text-gray-900">Subir foto</h3>
							<button
								onClick={() => setShowUploadModal(false)}
								className="text-gray-400 hover:text-gray-600 transition-colors"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						{/* Upload area */}
						<div
							onClick={() => document.getElementById('profile-picture-upload')?.click()}
							className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
						>
							<div className="flex flex-col items-center">
								<svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
								</svg>
								<p className="text-gray-700 font-medium mb-2">
									Arrastra tu foto aquí o
								</p>
								<p className="text-gray-500 text-sm mb-4">haz clic para seleccionarla.</p>
								<p className="text-gray-400 text-xs">Formato aceptado: jpg</p>
							</div>
						</div>

						{/* Action buttons */}
						<div className="flex justify-between items-center">
							<button
								onClick={() => {
									setShowUploadModal(false)
									document.getElementById('profile-picture-upload')?.click()
								}}
								className="flex-1 mr-2 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
							>
								📁 Subir Foto
							</button>
							<button
								onClick={() => {
									setShowUploadModal(false)
									startCamera()
								}}
								className="flex-1 ml-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
							>
								📷 Tomar Foto
							</button>
						</div>

						{account.profilePictureUrl && (
							<button
								onClick={() => {
									setShowUploadModal(false)
									handleRemoveImage()
								}}
								className="w-full mt-3 px-6 py-3 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium"
							>
								Eliminar foto actual
							</button>
						)}
					</div>
				</div>
			)}

			{/* Camera Modal */}
			{showCameraModal && (
				<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-xl font-semibold mb-4">Tomar Foto de Perfil</h3>
						<div className="space-y-4">
							<div className="relative">
								<video
									ref={setCameraVideoRef}
									autoPlay
									playsInline
									muted
									className="w-full h-64 bg-gray-200 rounded-lg object-cover"
								/>
								{cameraStream && (
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="w-32 h-32 border-4 border-white rounded-full opacity-50"></div>
									</div>
								)}
							</div>
							<div className="flex space-x-3">
								<button
									onClick={capturePhoto}
									className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
								>
									📷 Capturar
								</button>
								<button
									onClick={stopCamera}
									className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
								>
									Cancelar
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Captured Photo Preview Modal */}
			{capturedImage && (
				<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-xl font-semibold mb-4">Vista Previa de la Foto</h3>
						<p className="text-sm text-green-600 mb-2">✅ Foto capturada correctamente</p>
						<div className="space-y-4">
							<div className="flex justify-center">
								<img
									src={capturedImage}
									alt="Captured photo preview"
									className="w-48 h-48 rounded-lg object-cover border border-gray-300"
								/>
							</div>
							<div className="flex space-x-3">
								<button
									onClick={useCapturedPhoto}
									disabled={uploadingImage}
									className={`flex-1 px-4 py-2 rounded-md transition-colors ${
										uploadingImage
											? 'bg-gray-100 text-gray-400 cursor-not-allowed'
											: 'bg-green-600 text-white hover:bg-green-700'
									}`}
								>
									{uploadingImage ? 'Subiendo...' : '✅ Usar Esta Foto'}
								</button>
								<button
									onClick={discardCapturedPhoto}
									disabled={uploadingImage}
									className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
								>
									❌ Descartar
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Email Preferences Section */}
			{user && (
				<EmailPreferences
					userId={user.uid}
					userType="candidate"
				/>
			)}
		</div>
	)
}

export default AccountPage
