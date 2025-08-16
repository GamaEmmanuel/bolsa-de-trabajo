export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/verifyToken'
import { can } from '@/lib/auth/rbac'
import { createJob, listJobs } from '@/domain/jobs/service'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const companyId = searchParams.get('companyId') || undefined
	const status = searchParams.get('status') || undefined
	const q = searchParams.get('q') || undefined
	const limit = Number(searchParams.get('limit') || 20)
	const jobs = await listJobs({ companyId, status: status as any, limit, q: q || undefined })
	return NextResponse.json({ ok: true, jobs })
}

export async function POST(request: Request) {
	const ctx = await requireAuth(request)
	if (!can(ctx, 'job.create')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
	const body = await request.json()
	if (!ctx.companyId) return NextResponse.json({ ok: false, error: 'missing_company' }, { status: 400 })
	const job = await createJob(ctx.companyId, ctx.uid, body)
	return NextResponse.json({ ok: true, job }, { status: 201 })
}