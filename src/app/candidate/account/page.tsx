'use client'

import React, { useState, useEffect, useRef } from 'react'
import { db, auth } from '../../../lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateEmail } from 'firebase/auth'
import LocationSelector from '../../../components/ui/LocationSelector'

interface UserAccount {
	userId: string
	email: string
	displayName: string
	firstName: string
	lastName: string
	phone?: string
	location?: string
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
		phone: '',
		location: '',
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

	const handleInputChange = (field: keyof UserAccount, value: any) => {
		setAccount(prev => ({ ...prev, [field]: value }))

		// Auto-save certain fields with debouncing
		if (user && (field === 'phone' || field === 'location' || field === 'firstName' || field === 'lastName')) {
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

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p className="ml-2 text-gray-600">Cargando cuenta...</p>
			</div>
		)
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Configuración de Cuenta</h1>
				<p className="text-gray-600 mt-1">Gestiona la información de tu cuenta y preferencias</p>
			</div>

			{/* Success/Error Messages */}
			{success && (
				<div className="p-4 bg-green-50 border border-green-200 rounded-md">
					<p className="text-green-600">¡Cuenta actualizada exitosamente!</p>
				</div>
			)}
			{error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-md">
					<p className="text-red-600">{error}</p>
				</div>
			)}

			{/* Personal Information */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Información Personal</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
						<input
							type="text"
							value={account.firstName}
							onChange={(e) => handleInputChange('firstName', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
						<input
							type="text"
							value={account.lastName}
							onChange={(e) => handleInputChange('lastName', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
						<input
							type="email"
							value={account.email}
							disabled
							className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
						/>
						<p className="text-xs text-gray-500 mt-1">El correo electrónico no se puede cambiar</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
						<input
							type="tel"
							value={account.phone || ''}
							onChange={(e) => handleInputChange('phone', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
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

			{/* Security */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Seguridad</h2>

				{!showPasswordForm ? (
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-medium text-gray-900">Contraseña</h3>
							<p className="text-sm text-gray-500">Último cambio: Nunca</p>
						</div>
						<button
							onClick={() => setShowPasswordForm(true)}
							className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
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
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Preferencias de Notificación</h2>
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
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
						</label>
					</div>
				</div>
			</div>

			{/* Privacy */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración de Privacidad</h2>
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
			<div className="flex justify-end">
				<button
					onClick={handleSave}
					disabled={saving}
					className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
				>
					{saving ? 'Guardando...' : 'Guardar Cambios'}
				</button>
			</div>
		</div>
	)
}

export default AccountPage
