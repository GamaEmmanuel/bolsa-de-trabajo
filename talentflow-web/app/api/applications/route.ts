export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/verifyToken'
import { can } from '@/lib/auth/rbac'
import { applyToJob, listApplicationsForCandidate } from '@/domain/applications/service'

export async function GET() {
	const ctx = await requireAuth()
	if (!can(ctx, 'application.read', { ownerUid: ctx.uid })) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
	const apps = await listApplicationsForCandidate(ctx.uid)
	return NextResponse.json({ ok: true, applications: apps })
}

export async function POST(request: Request) {
	const ctx = await requireAuth()
	if (!can(ctx, 'application.create')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
	const body = await request.json()
	if (!body?.jobId) return NextResponse.json({ ok: false, error: 'missing_jobId' }, { status: 400 })
	const app = await applyToJob(ctx.uid, body.jobId)
	return NextResponse.json({ ok: true, application: app }, { status: 201 })
}