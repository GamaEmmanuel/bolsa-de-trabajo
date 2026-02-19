'use client'

import React from 'react'
import Link from 'next/link'

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
  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Modelo de pago por publicación
        </span>
        <Link
          href="/company/job-postings/new"
          className="text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          Publicar Empleo
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Modelo de Pago
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Paga $10 MXN por cada publicación de empleo. Sin suscripciones mensuales.
      </p>
      <Link
        href="/company/job-postings/new"
        className="inline-block px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors"
      >
        Publicar Empleo
      </Link>
    </div>
  )
}
