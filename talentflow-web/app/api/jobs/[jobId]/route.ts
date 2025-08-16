export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/verifyToken'
import { can } from '@/lib/auth/rbac'
import { getJob, updateJob, deleteJob } from '@/domain/jobs/service'

export async function GET(_: Request, context: any) {
	const job = await getJob(context.params.jobId)
	if (!job) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
	return NextResponse.json({ ok: true, job })
}

export async function PUT(request: Request, context: any) {
	const ctx = await requireAuth(request)
	if (!can(ctx, 'job.update')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
	const body = await request.json()
	const job = await updateJob(context.params.jobId, body)
	return NextResponse.json({ ok: true, job })
}

export async function DELETE(request: Request, context: any) {
	const ctx = await requireAuth(request)
	if (!can(ctx, 'job.delete')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
	await deleteJob(context.params.jobId)
	return NextResponse.json({ ok: true })
}