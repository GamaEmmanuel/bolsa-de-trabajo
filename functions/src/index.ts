import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { google } from 'googleapis';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Gmail API configuration
const GMAIL_CONFIG = {
  clientId: process.env.GMAIL_CLIENT_ID || functions.config().gmail?.client_id,
  clientSecret: process.env.GMAIL_CLIENT_SECRET || functions.config().gmail?.client_secret,
  refreshToken: process.env.GMAIL_REFRESH_TOKEN || functions.config().gmail?.refresh_token,
  userEmail: process.env.GMAIL_USER_EMAIL || functions.config().gmail?.user_email || 'mesereamx@gmail.com',
};

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key || '', {
  apiVersion: '2024-11-20.acacia' as any,
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
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    console.error('No Stripe signature found');
    res.status(400).send('No signature found');
    return;
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log('Received webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed', details: error.message });
  }
});

// Handle checkout session completed
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const companyId = session.metadata?.companyId;
  const customerId = session.customer as string;

  if (!companyId) {
    console.error('No companyId in session metadata');
    return;
  }

  console.log('Checkout completed for company:', companyId);

  // Get the subscription
  const subscriptionId = session.subscription as string;
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
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const companyId = subscription.metadata?.companyId;

  if (!companyId) {
    // Try to find company by stripeCustomerId
    const customerId = subscription.customer as string;
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

async function updateCompanySubscription(companyId: string, subscription: Stripe.Subscription) {
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
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const companyId = subscription.metadata?.companyId;

  if (!companyId) {
    // Try to find company by stripeCustomerId
    const customerId = subscription.customer as string;
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

async function cancelCompanySubscription(companyId: string, subscriptionId: string) {
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
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log('Invoice not related to subscription');
    return;
  }

  // Get subscription to get company ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  let companyId = subscription.metadata?.companyId;

  if (!companyId) {
    // Try to find company by stripeCustomerId
    const customerId = subscription.customer as string;
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
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log('Invoice not related to subscription');
    return;
  }

  // Get subscription to get company ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  let companyId = subscription.metadata?.companyId;

  if (!companyId) {
    // Try to find company by stripeCustomerId
    const customerId = subscription.customer as string;
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
export const syncSubscription = functions.https.onRequest(async (req, res) => {
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
    let targetCompanyId = companyId as string;

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

  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

/**
 * Send Application Email Notification
 * Checks email preferences before sending
 */
export const sendApplicationEmail = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {
    candidateId,
    candidateEmail,
    candidateName,
    jobTitle,
    companyId,
    companyName,
    applicationDate
  } = data;

  console.log('📧 Processing application email notification for:', candidateEmail);

  try {
    const results: any = {
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
    } else {
      // Build template data
      const baseUrl = 'https://meserea.com';
      const templateData: any = {
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

      // Send via Gmail API
      const emailResponse = await sendEmailViaGmail(templateData);
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
    } else {
      // Build company template data
      const baseUrl = 'https://meserea.com';
      const companyTemplateData: any = {
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

      // Send via Gmail API
      const emailResponse = await sendEmailViaGmail(companyTemplateData);
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
  } catch (error: any) {
    console.error('Error sending application emails:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper function to encode subject with UTF-8 (handles emojis and special characters)
function encodeSubject(subject: string): string {
  // Encode subject line properly for MIME (RFC 2047)
  const encoded = Buffer.from(subject, 'utf-8').toString('base64');
  return `=?UTF-8?B?${encoded}?=`;
}

// Helper function to create MIME email message
function createMimeMessage(
  to: string,
  from: string,
  subject: string,
  htmlBody: string,
  textBody: string
): string {
  const boundary = '----=_Part_' + Math.random().toString(36).substring(2);

  // Encode subject for proper UTF-8 handling
  const encodedSubject = encodeSubject(subject);

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(textBody, 'utf-8').toString('base64'),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(htmlBody, 'utf-8').toString('base64'),
    '',
    `--${boundary}--`,
  ].join('\r\n');

  return Buffer.from(message).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper function to build HTML email
function buildHtmlEmail(templateData: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5; }
        .container { background-color: #ffffff; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .details { background: #f9fafb; padding: 20px; margin: 20px 0; border-left: 4px solid #ec4899; border-radius: 4px; }
        .detail-item { margin: 12px 0; font-size: 14px; }
        .button { display: inline-block; padding: 14px 32px; background: #ec4899; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>${templateData.title}</h1></div>
        <div class="content">
            <p>${templateData.greeting}</p>
            <p><strong>${templateData.main_message}</strong></p>
            ${templateData.secondary_message ? `<p>${templateData.secondary_message}</p>` : ''}
            ${templateData.detail_1_label ? `
            <div class="details">
                <div class="detail-item"><strong>${templateData.detail_1_label}</strong> ${templateData.detail_1_value || ''}</div>
                ${templateData.detail_2_label ? `<div class="detail-item"><strong>${templateData.detail_2_label}</strong> ${templateData.detail_2_value || ''}</div>` : ''}
                ${templateData.detail_3_label ? `<div class="detail-item"><strong>${templateData.detail_3_label}</strong> ${templateData.detail_3_value || ''}</div>` : ''}
            </div>
            ` : ''}
            ${templateData.action_url ? `<div style="text-align: center; margin: 30px 0;"><a href="${templateData.action_url}" class="button">${templateData.action_label || 'Ver Detalles'}</a></div>` : ''}
        </div>
        <div class="footer">
            <p>${templateData.footer_message}</p>
            <p><strong>${templateData.company_name || 'HR Portal'}</strong></p>
            <p style="font-size: 11px; color: #999;">Este es un correo automático, por favor no responder.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Helper function to convert to plain text
function htmlToText(templateData: any): string {
  let text = `${templateData.title}\n\n`;
  text += `${templateData.greeting}\n\n`;
  text += `${templateData.main_message}\n\n`;
  if (templateData.secondary_message) text += `${templateData.secondary_message}\n\n`;
  if (templateData.detail_1_label) text += `${templateData.detail_1_label}: ${templateData.detail_1_value || ''}\n`;
  if (templateData.detail_2_label) text += `${templateData.detail_2_label}: ${templateData.detail_2_value || ''}\n`;
  if (templateData.detail_3_label) text += `${templateData.detail_3_label}: ${templateData.detail_3_value || ''}\n`;
  if (templateData.action_url) text += `\n${templateData.action_label || 'Ver Detalles'}: ${templateData.action_url}\n`;
  text += `\n---\n${templateData.footer_message}\n${templateData.company_name || 'HR Portal'}\n`;
  return text;
}

// Helper function to send email via Gmail API
async function sendEmailViaGmail(templateData: any) {
  try {
    console.log('📧 Sending email via Gmail API to:', templateData.to_email);

    // Verify configuration
    if (!GMAIL_CONFIG.clientId || !GMAIL_CONFIG.clientSecret || !GMAIL_CONFIG.refreshToken) {
      console.error('❌ Gmail API not configured');
      return { success: false, error: 'Gmail API not configured' };
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CONFIG.clientId,
      GMAIL_CONFIG.clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: GMAIL_CONFIG.refreshToken,
    });

    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Build HTML and text versions
    const htmlBody = buildHtmlEmail(templateData);
    const textBody = htmlToText(templateData);

    // Create MIME message
    const encodedMessage = createMimeMessage(
      templateData.to_email,
      `Meserea <${GMAIL_CONFIG.userEmail}>`,
      templateData.subject,
      htmlBody,
      textBody
    );

    // Send email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('✅ Email sent via Gmail:', response.data.id);
    return { success: true, messageId: response.data.id || 'sent' };
  } catch (error: any) {
    console.error('❌ Gmail send failed:', error?.message);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
}

