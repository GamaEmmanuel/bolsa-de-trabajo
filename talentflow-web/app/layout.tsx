import './globals.css'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import Link from 'next/link'

export const metadata = {
	title: 'TalentFlow',
	description: 'Two-sided talent marketplace',
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="es">
			<body className="min-h-screen bg-white text-slate-900 antialiased">
				<AuthProvider>
					<header className="border-b border-slate-200">
						<nav className="mx-auto max-w-6xl flex items-center justify-between p-4">
							<Link href="/" className="font-semibold text-brand">TalentFlow</Link>
							<div className="flex items-center gap-4 text-sm">
								<Link href="/" className="hover:underline">Inicio</Link>
								<Link href="/docs" className="hover:underline">Docs</Link>
								<a href="/blueprint" className="hover:underline">Blueprint</a>
							</div>
						</nav>
					</header>
					{children}
				</AuthProvider>
			</body>
		</html>
	);
}