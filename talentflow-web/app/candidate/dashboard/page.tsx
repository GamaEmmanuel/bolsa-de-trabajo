"use client"

import { useEffect, useState } from 'react'
import { useApi } from '@/lib/http/api'

export default function CandidateDashboard() {
	const api = useApi()
	const [apps, setApps] = useState<any[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let mounted = true
		api.get('/api/applications').then((res) => {
			if (mounted && res.ok) setApps(res.applications || [])
			setLoading(false)
		})
		return () => {
			mounted = false
		}
	}, [])

	return (
		<main className="mx-auto max-w-5xl p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Mis Postulaciones</h1>
			{loading ? (
				<p className="text-slate-600">Cargando…</p>
			) : (
				<div className="space-y-3">
					{apps.length === 0 ? (
						<p className="text-slate-600">Aún no has aplicado a vacantes.</p>
					) : (
						apps.map((a) => (
							<div key={a.applicationId} className="rounded border p-4">
								<div className="text-sm text-slate-500">{new Date(a.applicationDate).toLocaleString()}</div>
								<div className="font-medium">Estado: {a.pipelineStatus}</div>
							</div>
						))
					)}
				</div>
			)}
		</main>
	)
}