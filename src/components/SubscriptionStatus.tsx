'use client'

import React, { useEffect, useState } from 'react'
import { Company } from '@/types'
import { useAuth } from '@/lib/authContext'
import { useStripeCheckout } from '@/lib/useStripeCheckout'
import {
  hasActiveSubscription,
  getSubscriptionStatusMessage,
  getSubscriptionStatusColor,
  formatSubscriptionDate,
  subscriptionRequiresAction
} from '@/lib/subscriptionUtils'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { app } from '@/lib/firebase'

const db = getFirestore(app)

interface SubscriptionStatusProps {
  companyId: string
  showManageButton?: boolean
  compact?: boolean
}

export default function SubscriptionStatus({
  companyId,
  showManageButton = true,
  compact = false
}: SubscriptionStatusProps) {
  const { user } = useAuth()
  const { createPortalSession, loading } = useStripeCheckout()
  const [company, setCompany] = useState<Company | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    async function loadCompanyData() {
      try {
        const companyRef = doc(db, 'companies', companyId)
        const companyDoc = await getDoc(companyRef)

        if (companyDoc.exists()) {
          setCompany({
            companyId,
            ...companyDoc.data()
          } as Company)
        }
      } catch (err) {
        console.error('Error loading company:', err)
      } finally {
        setLoadingData(false)
      }
    }

    loadCompanyData()
  }, [companyId])

  const handleManageSubscription = async () => {
    await createPortalSession(companyId)
  }

  if (loadingData) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (!company) {
    return null
  }

  const isActive = hasActiveSubscription(company)
  const requiresAction = subscriptionRequiresAction(company)
  const status = company.subscription?.status
  const statusMessage = getSubscriptionStatusMessage(status)
  const statusColor = getSubscriptionStatusColor(status)
  const credits = company.credits || 0

  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
            {statusMessage}
          </span>
          <span className="text-sm text-gray-600">
            {credits.toLocaleString()} créditos
          </span>
        </div>
        {showManageButton && company.subscription?.stripeCustomerId && (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            {loading ? 'Cargando...' : 'Gestionar'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Estado de Suscripción
          </h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
            {statusMessage}
          </span>
        </div>
        {showManageButton && company.subscription?.stripeCustomerId && (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Cargando...' : 'Gestionar Suscripción'}
          </button>
        )}
      </div>

      {requiresAction && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ Tu suscripción requiere atención. Por favor actualiza tu método de pago.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Créditos de IA disponibles</p>
          <p className="text-2xl font-bold text-gray-900">{credits.toLocaleString()}</p>
        </div>
        {company.subscription?.currentPeriodEnd && (
          <div>
            <p className="text-sm text-gray-500">
              {company.subscription.cancelAtPeriodEnd ? 'Finaliza el' : 'Próxima renovación'}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatSubscriptionDate(company.subscription.currentPeriodEnd)}
            </p>
          </div>
        )}
      </div>

      {!isActive && !requiresAction && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-3">
            Suscríbete para acceder a todas las funciones premium
          </p>
          <a
            href="/company/subscription/checkout?plan=startup"
            className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Planes
          </a>
        </div>
      )}

      {company.subscription?.cancelAtPeriodEnd && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            Tu suscripción se cancelará al final del período actual.
            Aún puedes acceder a todas las funciones hasta entonces.
          </p>
        </div>
      )}
    </div>
  )
}

