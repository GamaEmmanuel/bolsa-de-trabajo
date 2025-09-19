'use client'

import React, { useState, useEffect } from 'react'
import { db, auth } from '../../../lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateEmail } from 'firebase/auth'

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

	// Fetch user account data
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser)
			if (currentUser) {
				try {
					const accountRef = doc(db, 'userAccounts', currentUser.uid)
					const accountDoc = await getDoc(accountRef)

					if (accountDoc.exists()) {
						const accountData = accountDoc.data() as UserAccount
						setAccount(accountData)
					} else {
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
					setError('Failed to load account information')
				} finally {
					setLoading(false)
				}
			} else {
				setLoading(false)
			}
		})

		return () => unsubscribeAuth()
	}, [])

	const handleInputChange = (field: keyof UserAccount, value: any) => {
		setAccount(prev => ({ ...prev, [field]: value }))
	}

	const handlePreferenceChange = (field: keyof UserAccount['preferences'], value: any) => {
		setAccount(prev => ({
			...prev,
			preferences: { ...prev.preferences, [field]: value }
		}))
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
			await setDoc(accountRef, accountData, { merge: true })

			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
		} catch (error) {
			console.error('Error saving account:', error)
			setError('Failed to save account information')
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
				<p className="ml-2 text-gray-600">Loading account...</p>
			</div>
		)
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
				<p className="text-gray-600 mt-1">Manage your account information and preferences</p>
			</div>

			{/* Success/Error Messages */}
			{success && (
				<div className="p-4 bg-green-50 border border-green-200 rounded-md">
					<p className="text-green-600">Account updated successfully!</p>
				</div>
			)}
			{error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-md">
					<p className="text-red-600">{error}</p>
				</div>
			)}

			{/* Personal Information */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
						<input
							type="text"
							value={account.firstName}
							onChange={(e) => handleInputChange('firstName', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
						<input
							type="text"
							value={account.lastName}
							onChange={(e) => handleInputChange('lastName', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
						<input
							type="email"
							value={account.email}
							disabled
							className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
						/>
						<p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
						<input
							type="tel"
							value={account.phone || ''}
							onChange={(e) => handleInputChange('phone', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
						<input
							type="text"
							value={account.location || ''}
							onChange={(e) => handleInputChange('location', e.target.value)}
							placeholder="City, State, Country"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>
			</div>

			{/* Security */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Security</h2>

				{!showPasswordForm ? (
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-medium text-gray-900">Password</h3>
							<p className="text-sm text-gray-500">Last changed: Never</p>
						</div>
						<button
							onClick={() => setShowPasswordForm(true)}
							className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
						>
							Change Password
						</button>
					</div>
				) : (
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">Change Password</h3>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
							<input
								type="password"
								value={passwordForm.currentPassword}
								onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
							<input
								type="password"
								value={passwordForm.newPassword}
								onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
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
								{saving ? 'Updating...' : 'Update Password'}
							</button>
							<button
								onClick={() => {
									setShowPasswordForm(false)
									setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
									setError(null)
								}}
								className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
							>
								Cancel
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Preferences */}
			<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
							<p className="text-sm text-gray-500">Receive updates via email</p>
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
							<h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
							<p className="text-sm text-gray-500">Receive updates via SMS</p>
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
							<h3 className="text-sm font-medium text-gray-900">Job Alerts</h3>
							<p className="text-sm text-gray-500">Get notified about new job opportunities</p>
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
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Settings</h2>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
					<select
						value={account.preferences.privacyLevel}
						onChange={(e) => handlePreferenceChange('privacyLevel', e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="public">Public - Anyone can see my profile</option>
						<option value="limited">Limited - Only employers I apply to can see my profile</option>
						<option value="private">Private - Only I can see my profile</option>
					</select>
					<p className="text-xs text-gray-500 mt-1">
						Your profile visibility affects how employers can find and view your information.
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
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</div>
	)
}

export default AccountPage
