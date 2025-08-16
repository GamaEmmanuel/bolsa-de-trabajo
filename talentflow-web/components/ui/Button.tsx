import * as React from 'react'
import Link from 'next/link'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	asChild?: boolean
	href?: string
}

export function Button({ asChild, href, className = '', children, ...props }: ButtonProps) {
	if (asChild && href) {
		return (
			<Link href={href} className={`btn btn-primary ${className}`}>
				{children}
			</Link>
		)
	}
	return (
		<button className={`btn btn-primary ${className}`} {...props}>
			{children}
		</button>
	)
}