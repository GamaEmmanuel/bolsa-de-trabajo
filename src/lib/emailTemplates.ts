// Email template builders for different notification types
import {
	EmailTemplateData,
	ApplicationSubmittedData,
	ApplicationStatusChangedData,
	NewApplicationReceivedData,
	PaymentNotificationData,
	SubscriptionNotificationData,
	WelcomeEmailData,
	NewMessageData,
} from '@/types/email'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Helper to translate pipeline status to Spanish
export function translateStatus(status: string): string {
	const translations: Record<string, string> = {
		'applied': 'Aplicado',
		'reviewed': 'Revisado',
		'interview': 'Entrevista',
		'assessments': 'Evaluaciones',
		'finalista': 'Finalista',
		'offer': 'Oferta',
		'hired': 'Contratado',
		'rejected': 'Rechazado',
		'not_moving_forward': 'No Continúa',
	}
	return translations[status] || status
}

// 1. APPLICATION SUBMITTED (to candidate)
export function buildApplicationSubmittedTemplate(data: ApplicationSubmittedData): Partial<EmailTemplateData> {
	return {
		subject: `✅ Aplicación enviada - ${data.jobTitle}`,
		title: '¡Aplicación Enviada Exitosamente!',
		greeting: `Hola ${data.candidateName},`,
		main_message: `Tu aplicación para el puesto de "${data.jobTitle}" en ${data.companyName} ha sido enviada exitosamente.`,
		secondary_message: 'El equipo de reclutamiento revisará tu perfil y te contactará si tu experiencia es adecuada para la posición.',
		detail_1_label: '🏢 Empresa',
		detail_1_value: data.companyName,
		detail_2_label: '💼 Puesto',
		detail_2_value: data.jobTitle,
		detail_3_label: '📅 Fecha de Aplicación',
		detail_3_value: new Date(data.applicationDate).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}),
		action_label: 'Ver Mis Aplicaciones',
		action_url: data.dashboardLink,
		footer_message: '¡Te deseamos mucha suerte en tu proceso de selección!',
	}
}

// 2. APPLICATION STATUS CHANGED (to candidate)
export function buildApplicationStatusChangedTemplate(data: ApplicationStatusChangedData): Partial<EmailTemplateData> {
	const statusEmoji: Record<string, string> = {
		'reviewed': '👀',
		'interview': '🎤',
		'assessments': '📝',
		'finalista': '🎉',
		'offer': '🎊',
		'hired': '🎆',
	}

	const emoji = statusEmoji[data.newStatus] || '📬'

	return {
		subject: `${emoji} Actualización de tu Aplicación - ${data.jobTitle}`,
		title: 'Tu Aplicación ha sido Actualizada',
		greeting: `Hola ${data.candidateName},`,
		main_message: `Tu aplicación para "${data.jobTitle}" en ${data.companyName} ha avanzado al siguiente estado.`,
		secondary_message: data.newStatus === 'finalista'
			? '¡Felicidades! Estás entre los finalistas para esta posición. El equipo de reclutamiento se pondrá en contacto contigo pronto.'
			: 'El equipo de reclutamiento está revisando tu perfil.',
		detail_1_label: '🏢 Empresa',
		detail_1_value: data.companyName,
		detail_2_label: '💼 Puesto',
		detail_2_value: data.jobTitle,
		detail_3_label: '📊 Estado Anterior',
		detail_3_value: translateStatus(data.oldStatus),
		detail_4_label: '✨ Nuevo Estado',
		detail_4_value: translateStatus(data.newStatus),
		action_label: 'Ver Detalles',
		action_url: data.dashboardLink,
		footer_message: '¡Continúa así!',
	}
}

// 3. APPLICATION REJECTED (to candidate)
export function buildApplicationRejectedTemplate(
	candidateEmail: string,
	candidateName: string,
	jobTitle: string,
	companyName: string,
	dashboardLink: string
): Partial<EmailTemplateData> {
	return {
		subject: `Actualización de tu Aplicación - ${jobTitle}`,
		title: 'Actualización de tu Aplicación',
		greeting: `Hola ${candidateName},`,
		main_message: `Gracias por tu interés en el puesto de "${jobTitle}" en ${companyName}.`,
		secondary_message: 'Después de una cuidadosa revisión, hemos decidido continuar con otros candidatos cuyas experiencias se alinean más estrechamente con nuestras necesidades actuales. Te animamos a seguir explorando otras oportunidades en nuestra plataforma.',
		detail_1_label: '🏢 Empresa',
		detail_1_value: companyName,
		detail_2_label: '💼 Puesto',
		detail_2_value: jobTitle,
		action_label: 'Ver Más Empleos',
		action_url: `${BASE_URL}/candidate/jobs`,
		footer_message: '¡No te desanimes! Hay muchas oportunidades esperándote.',
	}
}

// 4. NEW APPLICATION RECEIVED (to company)
export function buildNewApplicationReceivedTemplate(data: NewApplicationReceivedData): Partial<EmailTemplateData> {
	return {
		subject: `📥 Nueva Aplicación Recibida - ${data.jobTitle}`,
		title: '¡Nueva Aplicación Recibida!',
		greeting: `Hola ${data.companyName},`,
		main_message: `Has recibido una nueva aplicación para el puesto de "${data.jobTitle}".`,
		secondary_message: 'Revisa el perfil del candidato en tu panel de ATS y gestiona el proceso de selección.',
		detail_1_label: '👤 Candidato',
		detail_1_value: data.candidateName,
		detail_2_label: '💼 Puesto',
		detail_2_value: data.jobTitle,
		detail_3_label: '📅 Fecha de Aplicación',
		detail_3_value: new Date(data.applicationDate).toLocaleDateString('es-MX', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}),
		action_label: 'Ver en ATS',
		action_url: data.atsLink,
		footer_message: 'Gestiona todas tus aplicaciones en un solo lugar.',
	}
}

// 5. PAYMENT SUCCESSFUL (to company)
export function buildPaymentSuccessfulTemplate(data: PaymentNotificationData): Partial<EmailTemplateData> {
	return {
		subject: '✅ Pago Procesado Exitosamente',
		title: '¡Pago Confirmado!',
		greeting: `Hola ${data.companyName},`,
		main_message: `Tu pago de ${data.amount} ${data.currency} ha sido procesado exitosamente.`,
		secondary_message: data.creditsAwarded
			? `Se han agregado ${data.creditsAwarded} créditos de IA a tu cuenta.`
			: 'Tu suscripción está activa y lista para usar.',
		detail_1_label: '💳 Monto',
		detail_1_value: `${data.amount} ${data.currency}`,
		detail_2_label: '📅 Próximo Cobro',
		detail_2_value: data.nextBillingDate ? new Date(data.nextBillingDate).toLocaleDateString('es-MX') : 'N/A',
		detail_3_label: '🎯 Créditos Agregados',
		detail_3_value: data.creditsAwarded ? `${data.creditsAwarded} créditos` : 'N/A',
		action_label: 'Ver Facturación',
		action_url: data.billingPortalLink,
		footer_message: 'Gracias por tu confianza en HR Portal.',
	}
}

// 6. PAYMENT FAILED (to company)
export function buildPaymentFailedTemplate(data: PaymentNotificationData): Partial<EmailTemplateData> {
	return {
		subject: '⚠️ Error en el Procesamiento de Pago',
		title: 'Problema con tu Pago',
		greeting: `Hola ${data.companyName},`,
		main_message: 'No pudimos procesar tu pago más reciente. Por favor, actualiza tu método de pago para evitar interrupciones en tu servicio.',
		secondary_message: 'Si no actualizas tu método de pago, tu suscripción podría ser suspendida.',
		detail_1_label: '⚠️ Estado',
		detail_1_value: 'Pago Rechazado',
		detail_2_label: '💳 Acción Requerida',
		detail_2_value: 'Actualizar método de pago',
		action_label: 'Actualizar Pago',
		action_url: data.billingPortalLink,
		footer_message: 'Si necesitas ayuda, contáctanos inmediatamente.',
	}
}

// 7. SUBSCRIPTION ACTIVATED (to company)
export function buildSubscriptionActivatedTemplate(data: SubscriptionNotificationData): Partial<EmailTemplateData> {
	return {
		subject: '🎉 ¡Suscripción Activada!',
		title: '¡Bienvenido a HR Portal Premium!',
		greeting: `Hola ${data.companyName},`,
		main_message: '¡Tu suscripción ha sido activada exitosamente!',
		secondary_message: 'Ahora tienes acceso completo a todas las funcionalidades premium: publicación ilimitada de empleos, ATS avanzado, créditos de IA, y más.',
		detail_1_label: '✨ Estado',
		detail_1_value: 'Activa',
		detail_2_label: '🎯 Beneficios',
		detail_2_value: 'Acceso completo a todas las funcionalidades',
		action_label: 'Ir al Dashboard',
		action_url: `${BASE_URL}/company/dashboard`,
		footer_message: '¡Comienza a publicar empleos y encontrar talento!',
	}
}

// 8. SUBSCRIPTION CANCELED (to company)
export function buildSubscriptionCanceledTemplate(data: SubscriptionNotificationData): Partial<EmailTemplateData> {
	return {
		subject: 'Confirmación de Cancelación de Suscripción',
		title: 'Suscripción Cancelada',
		greeting: `Hola ${data.companyName},`,
		main_message: 'Tu suscripción a HR Portal ha sido cancelada.',
		secondary_message: 'Lamentamos verte partir. Tus datos permanecerán en tu cuenta y podrás reactivar tu suscripción en cualquier momento.',
		detail_1_label: '📊 Estado',
		detail_1_value: 'Cancelada',
		action_label: 'Reactivar Suscripción',
		action_url: `${BASE_URL}/company/subscription/checkout`,
		footer_message: '¡Esperamos verte de regreso pronto!',
	}
}

// 9. WELCOME CANDIDATE
export function buildWelcomeCandidateTemplate(data: WelcomeEmailData): Partial<EmailTemplateData> {
	return {
		subject: '👋 ¡Bienvenido a HR Portal!',
		title: '¡Bienvenido a HR Portal!',
		greeting: `Hola ${data.userName},`,
		main_message: '¡Estamos emocionados de tenerte con nosotros! HR Portal te ayudará a encontrar las mejores oportunidades laborales en México.',
		secondary_message: 'Completa tu perfil, sube tu CV, y comienza a aplicar a empleos que se ajusten a tus habilidades y experiencia.',
		detail_1_label: '✨ Próximos Pasos',
		detail_1_value: 'Completa tu perfil profesional',
		detail_2_label: '📄 Sube tu CV',
		detail_2_value: 'Aumenta tus posibilidades de ser contactado',
		detail_3_label: '💼 Explora Empleos',
		detail_3_value: 'Miles de oportunidades esperándote',
		action_label: 'Ir a Mi Dashboard',
		action_url: data.dashboardLink,
		footer_message: '¡Mucha suerte en tu búsqueda de empleo!',
	}
}

// 10. WELCOME COMPANY
export function buildWelcomeCompanyTemplate(data: WelcomeEmailData): Partial<EmailTemplateData> {
	return {
		subject: '🏢 ¡Bienvenido a HR Portal Enterprise!',
		title: '¡Bienvenido a HR Portal!',
		greeting: `Hola ${data.userName},`,
		main_message: '¡Gracias por unirte a HR Portal! Estamos listos para ayudarte a encontrar el mejor talento para tu empresa.',
		secondary_message: 'Completa el perfil de tu empresa, configura tu suscripción, y comienza a publicar ofertas de empleo.',
		detail_1_label: '✨ Próximos Pasos',
		detail_1_value: 'Completa el perfil de tu empresa',
		detail_2_label: '💳 Activa tu Suscripción',
		detail_2_value: 'Accede a todas las funcionalidades premium',
		detail_3_label: '📝 Publica Empleos',
		detail_3_value: 'Atrae a los mejores candidatos',
		action_label: 'Comenzar',
		action_url: data.dashboardLink,
		footer_message: '¡Comienza a construir tu equipo ideal!',
	}
}

// 11. NEW MESSAGE
export function buildNewMessageTemplate(data: NewMessageData): Partial<EmailTemplateData> {
	const senderTypeSpanish = data.senderType === 'company' ? 'una empresa' : 'un candidato'

	return {
		subject: `💬 Nuevo Mensaje de ${data.senderName}`,
		title: '¡Tienes un Nuevo Mensaje!',
		greeting: `Hola ${data.recipientName},`,
		main_message: `${data.senderName} (${senderTypeSpanish}) te ha enviado un mensaje.`,
		secondary_message: data.messagePreview.length > 100
			? `"${data.messagePreview.substring(0, 100)}..."`
			: `"${data.messagePreview}"`,
		detail_1_label: '👤 De',
		detail_1_value: data.senderName,
		detail_2_label: '📬 Mensajes sin leer',
		detail_2_value: data.unreadCount ? `${data.unreadCount} mensaje(s)` : '1 mensaje',
		action_label: 'Ver Mensaje',
		action_url: data.inboxLink,
		footer_message: 'Responde pronto para mantener la conversación activa.',
	}
}

