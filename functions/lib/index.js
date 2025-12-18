"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendApplicationEmail = exports.syncSubscription = exports.stripeWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// EmailJS configuration
const EMAILJS_SERVICE_ID = 'job-portal';
const EMAILJS_TEMPLATE_ID = 'template_kv50v38';
const EMAILJS_PUBLIC_KEY = 'dNgbSgz45xOHH5tbn';
const EMAILJS_PRIVATE_KEY = '-Eo8kdyuTIvbpl1345mph';
// Initialize Stripe
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key || '', {
    apiVersion: '2024-11-20.acacia',
});
// Stripe configuration
const STRIPE_CONFIG = {
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || functions.config().stripe?.webhook_secret || '',
    creditsPerMonth: 1000,
};
/**
 * Stripe Webhook Handler
 * Handles all Stripe webhook events for subscription management
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const signature = req.headers['stripe-signature'];
    if (!signature) {
        console.error('No Stripe signature found');
        res.status(400).send('No signature found');
        return;
    }
    let event;
    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(req.rawBody, signature, STRIPE_CONFIG.webhookSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    console.log('Received webhook event:', event.type);
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await handleCheckoutComplete(session);
                break;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await handleSubscriptionUpdate(subscription);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await handleSubscriptionDeleted(subscription);
                break;
            }
            case 'invoice.paid': {
                const invoice = event.data.object;
                await handleInvoicePaid(invoice);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                await handleInvoicePaymentFailed(invoice);
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed', details: error.message });
    }
});
// Handle checkout session completed
async function handleCheckoutComplete(session) {
    const companyId = session.metadata?.companyId;
    const customerId = session.customer;
    if (!companyId) {
        console.error('No companyId in session metadata');
        return;
    }
    console.log('Checkout completed for company:', companyId);
    // Get the subscription
    const subscriptionId = session.subscription;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    // Update company document
    const companyRef = db.collection('companies').doc(companyId);
    await companyRef.set({
        subscription: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        credits: admin.firestore.FieldValue.increment(STRIPE_CONFIG.creditsPerMonth),
    }, { merge: true });
    // Also store in dedicated subscriptions collection for easier querying
    const subscriptionRef = db.collection('subscriptions').doc(subscription.id);
    await subscriptionRef.set({
        companyId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status,
        planId: 'startup',
        planName: 'Empresa',
        amount: 10000, // $100 MXN in centavos
        currency: 'mxn',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Company subscription created:', companyId);
}
// Handle subscription update
async function handleSubscriptionUpdate(subscription) {
    const companyId = subscription.metadata?.companyId;
    if (!companyId) {
        // Try to find company by stripeCustomerId
        const customerId = subscription.customer;
        console.log('No companyId in subscription metadata, searching by customerId:', customerId);
        const companiesSnapshot = await db.collection('companies')
            .where('subscription.stripeCustomerId', '==', customerId)
            .limit(1)
            .get();
        if (companiesSnapshot.empty) {
            console.error('No company found for customerId:', customerId);
            return;
        }
        const companyDoc = companiesSnapshot.docs[0];
        await updateCompanySubscription(companyDoc.id, subscription);
        return;
    }
    console.log('Subscription updated for company:', companyId);
    await updateCompanySubscription(companyId, subscription);
}
async function updateCompanySubscription(companyId, subscription) {
    const companyRef = db.collection('companies').doc(companyId);
    await companyRef.set({
        subscription: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
    }, { merge: true });
    // Update subscriptions collection
    const subscriptionRef = db.collection('subscriptions').doc(subscription.id);
    await subscriptionRef.set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('Company subscription updated:', companyId);
}
// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
    const companyId = subscription.metadata?.companyId;
    if (!companyId) {
        // Try to find company by stripeCustomerId
        const customerId = subscription.customer;
        const companiesSnapshot = await db.collection('companies')
            .where('subscription.stripeCustomerId', '==', customerId)
            .limit(1)
            .get();
        if (companiesSnapshot.empty) {
            console.error('No company found for customerId:', customerId);
            return;
        }
        const companyDoc = companiesSnapshot.docs[0];
        await cancelCompanySubscription(companyDoc.id, subscription.id);
        return;
    }
    console.log('Subscription deleted for company:', companyId);
    await cancelCompanySubscription(companyId, subscription.id);
}
async function cancelCompanySubscription(companyId, subscriptionId) {
    const companyRef = db.collection('companies').doc(companyId);
    await companyRef.set({
        subscription: {
            status: 'canceled',
            cancelAtPeriodEnd: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
    }, { merge: true });
    // Update subscriptions collection
    const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
    await subscriptionRef.set({
        status: 'canceled',
        cancelAtPeriodEnd: false,
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('Company subscription canceled:', companyId);
}
// Handle invoice paid (recurring payments)
async function handleInvoicePaid(invoice) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
        console.log('Invoice not related to subscription');
        return;
    }
    // Get subscription to get company ID
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    let companyId = subscription.metadata?.companyId;
    if (!companyId) {
        // Try to find company by stripeCustomerId
        const customerId = subscription.customer;
        const companiesSnapshot = await db.collection('companies')
            .where('subscription.stripeCustomerId', '==', customerId)
            .limit(1)
            .get();
        if (companiesSnapshot.empty) {
            console.error('No company found for invoice');
            return;
        }
        companyId = companiesSnapshot.docs[0].id;
    }
    console.log('Invoice paid for company:', companyId);
    // Award monthly credits
    const companyRef = db.collection('companies').doc(companyId);
    await companyRef.set({
        subscription: {
            status: 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        credits: admin.firestore.FieldValue.increment(STRIPE_CONFIG.creditsPerMonth),
    }, { merge: true });
    console.log('Credits awarded to company:', companyId, STRIPE_CONFIG.creditsPerMonth);
}
// Handle invoice payment failed
async function handleInvoicePaymentFailed(invoice) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
        console.log('Invoice not related to subscription');
        return;
    }
    // Get subscription to get company ID
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    let companyId = subscription.metadata?.companyId;
    if (!companyId) {
        // Try to find company by stripeCustomerId
        const customerId = subscription.customer;
        const companiesSnapshot = await db.collection('companies')
            .where('subscription.stripeCustomerId', '==', customerId)
            .limit(1)
            .get();
        if (companiesSnapshot.empty) {
            console.error('No company found for invoice');
            return;
        }
        companyId = companiesSnapshot.docs[0].id;
    }
    console.log('Invoice payment failed for company:', companyId);
    // Update subscription status
    const companyRef = db.collection('companies').doc(companyId);
    await companyRef.set({
        subscription: {
            status: 'past_due',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
    }, { merge: true });
    console.log('Company subscription marked as past_due:', companyId);
}
/**
 * Manual subscription sync endpoint
 * Call this to manually sync a company's subscription from Stripe
 */
exports.syncSubscription = functions.https.onRequest(async (req, res) => {
    // Simple auth check - require a secret header
    const authHeader = req.headers['x-sync-secret'];
    if (authHeader !== process.env.SYNC_SECRET && authHeader !== functions.config().sync?.secret) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const { companyId, email } = req.query;
    if (!companyId && !email) {
        res.status(400).json({ error: 'companyId or email required' });
        return;
    }
    try {
        let targetCompanyId = companyId;
        // If email provided, find the company
        if (email && !companyId) {
            const usersSnapshot = await db.collection('users')
                .where('email', '==', email)
                .limit(1)
                .get();
            if (usersSnapshot.empty) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            targetCompanyId = usersSnapshot.docs[0].data().companyId;
            if (!targetCompanyId) {
                res.status(404).json({ error: 'User has no company' });
                return;
            }
        }
        // Get company document
        const companyDoc = await db.collection('companies').doc(targetCompanyId).get();
        if (!companyDoc.exists) {
            res.status(404).json({ error: 'Company not found' });
            return;
        }
        const companyData = companyDoc.data();
        const stripeCustomerId = companyData?.subscription?.stripeCustomerId;
        if (!stripeCustomerId) {
            // Try to find customer by email
            const userDoc = await db.collection('users')
                .where('companyId', '==', targetCompanyId)
                .limit(1)
                .get();
            if (userDoc.empty) {
                res.status(404).json({ error: 'No Stripe customer found' });
                return;
            }
            const userEmail = userDoc.docs[0].data().email;
            const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
            if (customers.data.length === 0) {
                res.status(404).json({ error: 'No Stripe customer found for email' });
                return;
            }
            const customer = customers.data[0];
            const subscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'all',
                limit: 1
            });
            if (subscriptions.data.length === 0) {
                res.status(404).json({ error: 'No subscription found' });
                return;
            }
            const subscription = subscriptions.data[0];
            // Update company with subscription data
            await db.collection('companies').doc(targetCompanyId).set({
                subscription: {
                    stripeCustomerId: customer.id,
                    stripeSubscriptionId: subscription.id,
                    stripePriceId: subscription.items.data[0].price.id,
                    status: subscription.status,
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                credits: admin.firestore.FieldValue.increment(STRIPE_CONFIG.creditsPerMonth),
            }, { merge: true });
            res.status(200).json({
                success: true,
                message: 'Subscription synced',
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    customerId: customer.id
                }
            });
            return;
        }
        // Get latest subscription from Stripe
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'all',
            limit: 1
        });
        if (subscriptions.data.length === 0) {
            res.status(404).json({ error: 'No subscription found in Stripe' });
            return;
        }
        const subscription = subscriptions.data[0];
        // Update Firestore
        await db.collection('companies').doc(targetCompanyId).set({
            subscription: {
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
        }, { merge: true });
        res.status(200).json({
            success: true,
            message: 'Subscription synced',
            subscription: {
                id: subscription.id,
                status: subscription.status
            }
        });
    }
    catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Sync failed', details: error.message });
    }
});
/**
 * Send Application Email Notification
 * Checks email preferences before sending
 */
exports.sendApplicationEmail = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { candidateId, candidateEmail, candidateName, jobTitle, companyId, companyName, applicationDate } = data;
    console.log('📧 Processing application email notification for:', candidateEmail);
    try {
        const results = {
            candidateEmail: null,
            companyEmail: null
        };
        // 1. Send email to CANDIDATE
        // Check candidate preferences
        const candidateDoc = await db.collection('users').doc(candidateId).get();
        const candidatePrefs = candidateDoc.data()?.emailPreferences;
        if (candidatePrefs?.applicationSubmitted === false) {
            console.log('⏭️ Candidate email skipped - user preferences disabled');
            results.candidateEmail = {
                success: true,
                messageId: 'skipped_by_preferences'
            };
        }
        else {
            // Build template data
            const baseUrl = 'https://meserea.com';
            const templateData = {
                to_email: candidateEmail,
                to_name: candidateName,
                notification_type: 'application_submitted',
                subject: `✅ Aplicación enviada - ${jobTitle}`,
                title: '¡Aplicación Enviada Exitosamente!',
                greeting: `Hola ${candidateName},`,
                main_message: `Tu aplicación para el puesto de "${jobTitle}" en ${companyName} ha sido enviada exitosamente.`,
                secondary_message: 'El equipo de reclutamiento revisará tu perfil y te contactará si tu experiencia es adecuada para la posición.',
                detail_1_label: '🏢 Empresa',
                detail_1_value: companyName,
                detail_2_label: '💼 Puesto',
                detail_2_value: jobTitle,
                detail_3_label: '📅 Fecha de Aplicación',
                detail_3_value: new Date(applicationDate).toLocaleDateString('es-MX'),
                action_label: 'Ver Mis Aplicaciones',
                action_url: `${baseUrl}/candidate/my-applications`,
                footer_message: '¡Te deseamos mucha suerte en tu proceso de selección!',
                company_name: 'HR Portal',
            };
            // Send via EmailJS REST API
            const emailResponse = await sendEmailViaEmailJS(templateData);
            results.candidateEmail = emailResponse;
        }
        // 2. Send email to COMPANY
        // Get company email
        const companyDoc = await db.collection('users').doc(companyId).get();
        if (!companyDoc.exists) {
            console.log('⚠️ Company user not found');
            results.companyEmail = { success: false, error: 'Company not found' };
            return results;
        }
        const companyData = companyDoc.data();
        const companyEmail = companyData?.email;
        if (!companyEmail) {
            console.log('⚠️ Company email not found');
            results.companyEmail = { success: false, error: 'Company email not found' };
            return results;
        }
        // Check company preferences
        const companyPrefs = companyData?.emailPreferences;
        if (companyPrefs?.newApplications === false) {
            console.log('⏭️ Company email skipped - user preferences disabled');
            results.companyEmail = {
                success: true,
                messageId: 'skipped_by_preferences'
            };
        }
        else {
            // Build company template data
            const baseUrl = 'https://meserea.com';
            const companyTemplateData = {
                to_email: companyEmail,
                to_name: companyName,
                notification_type: 'new_application',
                subject: `📥 Nueva Aplicación Recibida - ${jobTitle}`,
                title: '¡Nueva Aplicación Recibida!',
                greeting: `Hola ${companyName},`,
                main_message: `Has recibido una nueva aplicación para el puesto de "${jobTitle}".`,
                secondary_message: 'Revisa el perfil del candidato en tu panel de ATS y gestiona el proceso de selección.',
                detail_1_label: '👤 Candidato',
                detail_1_value: candidateName,
                detail_2_label: '💼 Puesto',
                detail_2_value: jobTitle,
                detail_3_label: '📅 Fecha de Aplicación',
                detail_3_value: new Date(applicationDate).toLocaleDateString('es-MX'),
                action_label: 'Ver en ATS',
                action_url: `${baseUrl}/company/ats`,
                footer_message: 'Gestiona todas tus aplicaciones en un solo lugar.',
                company_name: 'HR Portal',
            };
            // Send via EmailJS REST API
            const emailResponse = await sendEmailViaEmailJS(companyTemplateData);
            results.companyEmail = emailResponse;
        }
        // Log to Firestore
        await db.collection('emailLogs').add({
            candidateEmail: candidateEmail,
            companyEmail: companyEmail,
            candidateStatus: results.candidateEmail?.messageId || 'sent',
            companyStatus: results.companyEmail?.messageId || 'sent',
            jobTitle: jobTitle,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return results;
    }
    catch (error) {
        console.error('Error sending application emails:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// Helper function to send email via EmailJS REST API
async function sendEmailViaEmailJS(templateData) {
    try {
        // Only include fields with values to prevent undefined in template
        const cleanedData = {
            to_email: templateData.to_email || '',
            to_name: templateData.to_name || '',
            notification_type: templateData.notification_type || '',
            subject: templateData.subject || '',
            title: templateData.title || '',
            greeting: templateData.greeting || '',
            main_message: templateData.main_message || '',
            footer_message: templateData.footer_message || '',
            company_name: templateData.company_name || 'HR Portal',
        };
        // Add optional fields only if they have values
        if (templateData.secondary_message)
            cleanedData.secondary_message = templateData.secondary_message;
        if (templateData.action_label)
            cleanedData.action_label = templateData.action_label;
        if (templateData.action_url)
            cleanedData.action_url = templateData.action_url;
        if (templateData.detail_1_label) {
            cleanedData.detail_1_label = templateData.detail_1_label;
            cleanedData.detail_1_value = templateData.detail_1_value || '';
        }
        if (templateData.detail_2_label) {
            cleanedData.detail_2_label = templateData.detail_2_label;
            cleanedData.detail_2_value = templateData.detail_2_value || '';
        }
        if (templateData.detail_3_label) {
            cleanedData.detail_3_label = templateData.detail_3_label;
            cleanedData.detail_3_value = templateData.detail_3_value || '';
        }
        if (templateData.detail_4_label) {
            cleanedData.detail_4_label = templateData.detail_4_label;
            cleanedData.detail_4_value = templateData.detail_4_value || '';
        }
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                accessToken: EMAILJS_PRIVATE_KEY,
                template_params: cleanedData,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('EmailJS error:', errorText);
            return { success: false, error: errorText };
        }
        const responseText = await response.text();
        console.log('✅ Email sent via EmailJS:', responseText);
        return { success: true, messageId: responseText || 'OK' };
    }
    catch (error) {
        console.error('Error sending email via EmailJS:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=index.js.map