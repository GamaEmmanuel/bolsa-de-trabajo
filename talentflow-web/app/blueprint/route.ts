import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const dynamic = 'force-static'

export async function GET() {
	const filePath = join(process.cwd(), 'docs', 'Blueprint.md')
	try {
		const content = await readFile(filePath, 'utf-8')
		return new NextResponse(content, {
			headers: { 'content-type': 'text/markdown; charset=utf-8' },
		})
	} catch (e) {
		return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
	}
}