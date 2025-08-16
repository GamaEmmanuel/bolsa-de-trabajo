export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/verifyToken'
import { can } from '@/lib/auth/rbac'
import { updateApplicationStatus } from '@/domain/applications/service'

export async function PUT(request: Request, context: any) {
	const ctx = await requireAuth(request)
	if (!can(ctx, 'application.update')) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
	const body = await request.json()
	if (!body?.status) return NextResponse.json({ ok: false, error: 'missing_status' }, { status: 400 })
	await updateApplicationStatus(context.params.applicationId, body.status)
	return NextResponse.json({ ok: true })
}