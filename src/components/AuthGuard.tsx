'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/authContext'
import { getUserPreferences, getRedirectPath } from '../lib/userPreferences'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo
}) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // Still loading, wait

    if (requireAuth && !user) {
      // User needs to be authenticated but isn't
      router.push(redirectTo || '/signin')
      return
    }

    if (!requireAuth && user) {
      // User is authenticated but shouldn't be (e.g., on signin page)
      // Redirect to appropriate dashboard based on user preferences
      const redirectUser = async () => {
        try {
          const preferences = await getUserPreferences(user.uid)
          if (preferences) {
            router.push(getRedirectPath(preferences))
          } else {
            router.push('/onboarding')
          }
        } catch (error) {
          console.error('Error checking user preferences:', error)
          router.push('/onboarding')
        }
      }
      redirectUser()
      return
    }
  }, [user, loading, requireAuth, redirectTo, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user needs auth but isn't authenticated, don't render children
  if (requireAuth && !user) {
    return null
  }

  // If user shouldn't be authenticated but is, don't render children
  if (!requireAuth && user) {
    return null
  }

  return <>{children}</>
}
