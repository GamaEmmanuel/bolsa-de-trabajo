"use client"

import { onIdTokenChanged, User as FirebaseUser } from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getClientAuth } from './client'

interface AuthState {
	user: FirebaseUser | null
	loading: boolean
	getToken: (forceRefresh?: boolean) => Promise<string | null>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<FirebaseUser | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const auth = getClientAuth()
		const unsub = onIdTokenChanged(auth, async (u) => {
			setUser(u)
			setLoading(false)
		})
		return () => unsub()
	}, [])

	const value = useMemo<AuthState>(() => ({
		user,
		loading,
		getToken: async (forceRefresh?: boolean) => {
			if (!user) return null
			return user.getIdToken(!!forceRefresh)
		},
	}), [user, loading])

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used within AuthProvider')
	return ctx
}