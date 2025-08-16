"use client"

import { useAuth } from '@/lib/auth/AuthProvider'

export function useApi() {
	const { getToken } = useAuth()
	return {
		get: async (url: string) => {
			const token = await getToken()
			const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
			return res.json()
		},
		post: async (url: string, body: any) => {
			const token = await getToken()
			const res = await fetch(url, {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify(body),
			})
			return res.json()
		},
		put: async (url: string, body: any) => {
			const token = await getToken()
			const res = await fetch(url, {
				method: 'PUT',
				headers: {
					'content-type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify(body),
			})
			return res.json()
		},
	}
}