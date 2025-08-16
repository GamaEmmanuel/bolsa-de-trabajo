import type { AuthContext } from './verifyToken'

type Action =
	| 'job.create'
	| 'job.read'
	| 'job.update'
	| 'job.delete'
	| 'application.create'
	| 'application.read'
	| 'application.update'
	| 'company.user.manage'
	| 'billing.manage'

export function can(ctx: AuthContext, action: Action, scope?: { companyId?: string; ownerUid?: string; assignedRecruiterUid?: string }) {
	const role = ctx.role
	if (ctx.role === 'super_admin') return true

	switch (action) {
		case 'job.create':
			return role === 'recruiter' || role === 'supervisor' || role === 'company_admin'
		case 'job.read':
			return true
		case 'job.update':
			return role === 'company_admin' || role === 'supervisor' || role === 'recruiter'
		case 'job.delete':
			return role === 'company_admin'
		case 'application.create':
			return role === 'candidate'
		case 'application.read':
			if (role === 'candidate') return scope?.ownerUid === ctx.uid
			return role === 'recruiter' || role === 'supervisor' || role === 'company_admin'
		case 'application.update':
			return role === 'recruiter' || role === 'supervisor' || role === 'company_admin'
		case 'company.user.manage':
			return role === 'company_admin' || role === 'super_admin'
		case 'billing.manage':
			return role === 'company_admin' || role === 'super_admin'
		default:
			return false
	}
}