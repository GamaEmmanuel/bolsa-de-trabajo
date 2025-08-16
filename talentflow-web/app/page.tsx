import Link from 'next/link'

export default function HomePage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-8">
			<div className="max-w-2xl text-center space-y-6">
				<h1 className="text-3xl md:text-5xl font-semibold text-brand">TalentFlow</h1>
				<p className="text-slate-600">Two-sided talent marketplace scaffold. Firebase Firestore is configured; see code in <code>lib/firebase</code>.</p>
				<div className="flex items-center justify-center gap-4">
					<Link className="rounded bg-brand px-4 py-2 text-white" href="/api/health">API Health</Link>
					<Link className="rounded border border-slate-300 px-4 py-2" href="/docs">Docs</Link>
					<a className="underline text-slate-700" href="/blueprint">Blueprint</a>
				</div>
			</div>
		</main>
	)
}