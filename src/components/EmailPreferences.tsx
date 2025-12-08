'use client'

import React, { useState, useEffect } from 'react'
import { EmailPreferences as EmailPreferencesType } from '../types'

interface EmailPreferencesProps {
	userId: string
	userType: 'candidate' | 'company'
	onSave?: (preferences: EmailPreferencesType) => void
}

const EmailPreferences: React.FC<EmailPreferencesProps> = ({ userId, userType, onSave }) => {
	const [preferences, setPreferences] = useState<EmailPreferencesType>({
		applicationSubmitted: true,
		applicationStatusChanged: true,
		applicationRejected: true,
		newMessages: true,
		paymentNotifications: true,
		subscriptionUpdates: true,
		creditsAwarded: true,
		newApplications: true,
		jobStatusUpdates: true,
		weeklyDigest: false,
		marketingEmails: false,
	})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

	useEffect(() => {
		loadPreferences()
	}, [userId])

	const loadPreferences = async () => {
		try {
			// Load from Firestore
			const response = await fetch(`/api/email-preferences?userId=${userId}`)
			if (response.ok) {
				const data = await response.json()
				if (data.preferences) {
					setPreferences({ ...preferences, ...data.preferences })
				}
			}
		} catch (error) {
			console.error('Error loading email preferences:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		setSaving(true)
		setMessage(null)

		try {
			const response = await fetch('/api/email-preferences', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, preferences }),
			})

			if (response.ok) {
				setMessage({ type: 'success', text: 'Preferencias guardadas exitosamente' })
				onSave?.(preferences)
			} else {
				throw new Error('Failed to save preferences')
			}
		} catch (error) {
			console.error('Error saving email preferences:', error)
			setMessage({ type: 'error', text: 'Error al guardar preferencias' })
		} finally {
			setSaving(false)
		}
	}

	const handleToggle = (key: keyof EmailPreferencesType) => {
		setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
				<span className="ml-2 text-gray-600">Cargando preferencias...</span>
			</div>
		)
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Preferencias de Email</h2>
				<p className="text-gray-600">
					Configura qué notificaciones deseas recibir por correo electrónico.
				</p>
			</div>

			<div className="space-y-6">
				{/* Application Notifications (for candidates) */}
				{userType === 'candidate' && (
					<div>
						<h3 className="text-lg font-semibold text-gray-900 mb-3">📬 Notificaciones de Aplicaciones</h3>
						<div className="space-y-3 ml-4">
							<label className="flex items-center justify-between cursor-pointer">
								<div>
									<span className="text-gray-800 font-medium">Aplicación Enviada</span>
									<p className="text-sm text-gray-500">Confirmación cuando envías una aplicación</p>
								</div>
								<input
									type="checkbox"
									checked={preferences.applicationSubmitted}
									onChange={() => handleToggle('applicationSubmitted')}
									className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
								/>
							</label>
							<label className="flex items-center justify-between cursor-pointer">
								<div>
									<span className="text-gray-800 font-medium">Cambios de Estado</span>
									<p className="text-sm text-gray-500">Cuando tu aplicación avanza en el proceso</p>
								</div>
								<input
									type="checkbox"
									checked={preferences.applicationStatusChanged}
									onChange={() => handleToggle('applicationStatusChanged')}
									className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
								/>
							</label>
							<label className="flex items-center justify-between cursor-pointer">
								<div>
									<span className="text-gray-800 font-medium">Aplicación Rechazada</span>
									<p className="text-sm text-gray-500">Notificación cuando una aplicación no continúa</p>
								</div>
								<input
									type="checkbox"
									checked={preferences.applicationRejected}
									onChange={() => handleToggle('applicationRejected')}
									className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
								/>
							</label>
						</div>
					</div>
				)}

				{/* Job Notifications (for companies) */}
				{userType === 'company' && (
					<div>
						<h3 className="text-lg font-semibold text-gray-900 mb-3">💼 Notificaciones de Empleos</h3>
						<div className="space-y-3 ml-4">
							<label className="flex items-center justify-between cursor-pointer">
								<div>
									<span className="text-gray-800 font-medium">Nuevas Aplicaciones</span>
									<p className="text-sm text-gray-500">Cuando recibes nuevas aplicaciones</p>
								</div>
								<input
									type="checkbox"
									checked={preferences.newApplications}
									onChange={() => handleToggle('newApplications')}
									className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
								/>
							</label>
							<label className="flex items-center justify-between cursor-pointer">
								<div>
									<span className="text-gray-800 font-medium">Estado de Empleos</span>
									<p className="text-sm text-gray-500">Publicaciones, expiraciones, etc.</p>
								</div>
								<input
									type="checkbox"
									checked={preferences.jobStatusUpdates}
									onChange={() => handleToggle('jobStatusUpdates')}
									className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
								/>
							</label>
						</div>
					</div>
				)}

				{/* Payment Notifications (for companies) */}
				{userType === 'company' && (
					<div>
						<h3 className="text-lg font-semibold text-gray-900 mb-3">💳 Notificaciones de Pagos</h3>
						<div className="space-y-3 ml-4">
							<label className="flex items-center justify-between cursor-pointer">
								<div>
									<span className="text-gray-800 font-medium">Pagos y Facturación</span>
									<p className="text-sm text-gray-500">Confirmaciones de pago y problemas</p>
								</div>
								<input
									type="checkbox"
									checked={preferences.paymentNotifications}
									onChange={() => handleToggle('paymentNotifications')}
									className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
								/>
							</label>
							<label className="flex items-center justify-between cursor-pointer">
								<div>
									<span className="text-gray-800 font-medium">Actualizaciones de Suscripción</span>
									<p className="text-sm text-gray-500">Cambios en tu plan y renovaciones</p>
								</div>
								<input
									type="checkbox"
									checked={preferences.subscriptionUpdates}
									onChange={() => handleToggle('subscriptionUpdates')}
									className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
								/>
							</label>
							<label className="flex items-center justify-between cursor-pointer">
								<div>
									<span className="text-gray-800 font-medium">Créditos de IA</span>
									<p className="text-sm text-gray-500">Cuando recibes nuevos créditos</p>
								</div>
								<input
									type="checkbox"
									checked={preferences.creditsAwarded}
									onChange={() => handleToggle('creditsAwarded')}
									className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
								/>
							</label>
						</div>
					</div>
				)}

				{/* Communication Notifications */}
				<div>
					<h3 className="text-lg font-semibold text-gray-900 mb-3">💬 Comunicación</h3>
					<div className="space-y-3 ml-4">
						<label className="flex items-center justify-between cursor-pointer">
							<div>
								<span className="text-gray-800 font-medium">Nuevos Mensajes</span>
								<p className="text-sm text-gray-500">Cuando recibes mensajes en tu inbox</p>
							</div>
							<input
								type="checkbox"
								checked={preferences.newMessages}
								onChange={() => handleToggle('newMessages')}
								className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
							/>
						</label>
					</div>
				</div>

				{/* General Notifications */}
				<div>
					<h3 className="text-lg font-semibold text-gray-900 mb-3">📊 General</h3>
					<div className="space-y-3 ml-4">
						<label className="flex items-center justify-between cursor-pointer">
							<div>
								<span className="text-gray-800 font-medium">Resumen Semanal</span>
								<p className="text-sm text-gray-500">Estadísticas y actualizaciones semanales</p>
							</div>
							<input
								type="checkbox"
								checked={preferences.weeklyDigest}
								onChange={() => handleToggle('weeklyDigest')}
								className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
							/>
						</label>
						<label className="flex items-center justify-between cursor-pointer">
							<div>
								<span className="text-gray-800 font-medium">Correos de Marketing</span>
								<p className="text-sm text-gray-500">Novedades, consejos y promociones</p>
							</div>
							<input
								type="checkbox"
								checked={preferences.marketingEmails}
								onChange={() => handleToggle('marketingEmails')}
								className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
							/>
						</label>
					</div>
				</div>
			</div>

			{/* Save Button */}
			<div className="mt-8 pt-6 border-t border-gray-200">
				<div className="flex items-center justify-between">
					<div>
						{message && (
							<p
								className={`text-sm ${
									message.type === 'success' ? 'text-green-600' : 'text-red-600'
								}`}
							>
								{message.text}
							</p>
						)}
					</div>
					<button
						onClick={handleSave}
						disabled={saving}
						className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{saving ? 'Guardando...' : 'Guardar Preferencias'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default EmailPreferences

