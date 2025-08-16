"use client"

import { useEffect, useState } from 'react'
import { useApi } from '@/lib/http/api'

export default function EmployerJobsPage() {
	const api = useApi()
	const [jobs, setJobs] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [title, setTitle] = useState('')
	const [desc, setDesc] = useState('')

	async function load() {
		setLoading(true)
		const res = await api.get('/api/jobs?limit=50')
		if (res.ok) setJobs(res.jobs)
		setLoading(false)
	}

	useEffect(() => {
		load()
	}, [])

	async function create() {
		if (!title || !desc) return
		const res = await api.post('/api/jobs', { jobTitle: title, jobDescription: desc })
		if (res.ok) {
			setTitle('')
			setDesc('')
			load()
		}
	}

	return (
		<main className="mx-auto max-w-6xl p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Mis Vacantes</h1>
			<section className="rounded border p-4 space-y-3">
				<h2 className="font-medium">Crear nueva vacante</h2>
				<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full rounded border p-2" />
				<textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción" className="w-full rounded border p-2" />
				<button onClick={create} className="btn btn-primary">Publicar</button>
			</section>
			<section className="space-y-3">
				{loading ? (
					<p className="text-slate-600">Cargando…</p>
				) : (
					<div className="grid gap-3">
						{jobs.map((j) => (
							<div key={j.jobId} className="rounded border p-4">
								<div className="text-sm text-slate-500">{j.status}</div>
								<div className="font-medium">{j.jobTitle}</div>
								<div className="text-sm text-slate-600 line-clamp-2">{j.jobDescription}</div>
							</div>
						))}
					</div>
				)}
			</section>
		</main>
	)
}