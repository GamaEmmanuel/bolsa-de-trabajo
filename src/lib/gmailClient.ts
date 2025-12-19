// Gmail API client for sending emails
import { google } from 'googleapis';
import { EmailTemplateData } from '@/types/email';

// Gmail configuration from environment variables
const GMAIL_CONFIG = {
  clientId: process.env.GMAIL_CLIENT_ID || process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET || process.env.NEXT_PUBLIC_GMAIL_CLIENT_SECRET,
  refreshToken: process.env.GMAIL_REFRESH_TOKEN || process.env.NEXT_PUBLIC_GMAIL_REFRESH_TOKEN,
  userEmail: process.env.GMAIL_USER_EMAIL || process.env.NEXT_PUBLIC_GMAIL_USER_EMAIL || 'mesereamx@gmail.com',
};

// Create OAuth2 client
function createOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CONFIG.clientId,
    GMAIL_CONFIG.clientSecret,
    'http://localhost:3000/oauth2callback' // Only needed for initial setup
  );

  // Set refresh token
  if (GMAIL_CONFIG.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: GMAIL_CONFIG.refreshToken,
    });
  }

  return oauth2Client;
}

// Create MIME email message
function createMimeMessage(
  to: string,
  from: string,
  subject: string,
  htmlBody: string,
  textBody: string
): string {
  const boundary = '----=_Part_' + Math.random().toString(36).substring(2);

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  // Encode to base64url
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convert template data to HTML email
function buildHtmlEmail(templateData: EmailTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            margin: 20px auto;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 15px;
            color: #333;
        }
        .main-message {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 15px;
            color: #111;
        }
        .secondary-message {
            font-size: 14px;
            margin-bottom: 20px;
            color: #666;
        }
        .details {
            background: #f9fafb;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #ec4899;
            border-radius: 4px;
        }
        .detail-item {
            margin: 12px 0;
            font-size: 14px;
        }
        .detail-label {
            font-weight: 600;
            color: #ec4899;
            display: inline-block;
            min-width: 120px;
        }
        .detail-value {
            color: #333;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: #ec4899;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
        }
        .footer {
            background: #f9fafb;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-message {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        .company-name {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
        }
        .disclaimer {
            font-size: 11px;
            color: #999;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${templateData.title}</h1>
        </div>

        <div class="content">
            <p class="greeting">${templateData.greeting}</p>
            <p class="main-message">${templateData.main_message}</p>

            ${templateData.secondary_message ? `<p class="secondary-message">${templateData.secondary_message}</p>` : ''}

            ${templateData.detail_1_label ? `
            <div class="details">
                <div class="detail-item">
                    <span class="detail-label">${templateData.detail_1_label}</span>
                    <span class="detail-value">${templateData.detail_1_value || ''}</span>
                </div>
                ${templateData.detail_2_label ? `
                <div class="detail-item">
                    <span class="detail-label">${templateData.detail_2_label}</span>
                    <span class="detail-value">${templateData.detail_2_value || ''}</span>
                </div>
                ` : ''}
                ${templateData.detail_3_label ? `
                <div class="detail-item">
                    <span class="detail-label">${templateData.detail_3_label}</span>
                    <span class="detail-value">${templateData.detail_3_value || ''}</span>
                </div>
                ` : ''}
                ${templateData.detail_4_label ? `
                <div class="detail-item">
                    <span class="detail-label">${templateData.detail_4_label}</span>
                    <span class="detail-value">${templateData.detail_4_value || ''}</span>
                </div>
                ` : ''}
            </div>
            ` : ''}

            ${templateData.action_url ? `
            <div class="button-container">
                <a href="${templateData.action_url}" class="button">${templateData.action_label || 'Ver Detalles'}</a>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <p class="footer-message">${templateData.footer_message}</p>
            <p class="company-name">${templateData.company_name || 'HR Portal'}</p>
            <p class="disclaimer">Este es un correo automático, por favor no responder.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Convert HTML to plain text (simple version)
function htmlToText(templateData: EmailTemplateData): string {
  let text = `${templateData.title}\n\n`;
  text += `${templateData.greeting}\n\n`;
  text += `${templateData.main_message}\n\n`;

  if (templateData.secondary_message) {
    text += `${templateData.secondary_message}\n\n`;
  }

  if (templateData.detail_1_label) {
    text += `${templateData.detail_1_label}: ${templateData.detail_1_value || ''}\n`;
  }
  if (templateData.detail_2_label) {
    text += `${templateData.detail_2_label}: ${templateData.detail_2_value || ''}\n`;
  }
  if (templateData.detail_3_label) {
    text += `${templateData.detail_3_label}: ${templateData.detail_3_value || ''}\n`;
  }
  if (templateData.detail_4_label) {
    text += `${templateData.detail_4_label}: ${templateData.detail_4_value || ''}\n`;
  }

  if (templateData.action_url) {
    text += `\n${templateData.action_label || 'Ver Detalles'}: ${templateData.action_url}\n`;
  }

  text += `\n---\n${templateData.footer_message}\n`;
  text += `${templateData.company_name || 'HR Portal'}\n`;

  return text;
}

// Send email via Gmail API
export async function sendGmailEmail(templateData: EmailTemplateData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log('📧 Attempting to send email via Gmail API:', {
      to: templateData.to_email,
      subject: templateData.subject,
      type: templateData.notification_type,
    });

    // Verify configuration
    if (!GMAIL_CONFIG.clientId || !GMAIL_CONFIG.clientSecret || !GMAIL_CONFIG.refreshToken) {
      throw new Error('Gmail API not configured. Missing credentials in environment variables.');
    }

    // Create OAuth client
    const oauth2Client = createOAuth2Client();

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

    console.log('✅ Email sent successfully via Gmail:', response.data.id);

    // Log to Firestore
    try {
      const { db } = await import('./firebase');
      const { collection, addDoc } = await import('firebase/firestore');

      await addDoc(collection(db, 'emailLogs'), {
        status: 'sent',
        recipientEmail: templateData.to_email,
        recipientName: templateData.to_name,
        notificationType: templateData.notification_type,
        subject: templateData.subject,
        messageId: response.data.id || 'unknown',
        provider: 'gmail',
        sentAt: new Date(),
        timestamp: new Date().toISOString(),
      });
      console.log('📝 Email logged to Firestore');
    } catch (logError) {
      console.error('Failed to log email:', logError);
      // Don't fail the email send if logging fails
    }

    return { success: true, messageId: response.data.id || 'sent' };
  } catch (error: any) {
    console.error('❌ Gmail send failed:', error);
    console.error('❌ Error details:', {
      message: error?.message,
      code: error?.code,
      errors: error?.errors,
    });

    // Log failure to Firestore
    try {
      const { db } = await import('./firebase');
      const { collection, addDoc } = await import('firebase/firestore');

      await addDoc(collection(db, 'emailLogs'), {
        status: 'failed',
        recipientEmail: templateData.to_email,
        recipientName: templateData.to_name,
        notificationType: templateData.notification_type,
        subject: templateData.subject,
        error: error?.message || 'Unknown error',
        provider: 'gmail',
        sentAt: new Date(),
        timestamp: new Date().toISOString(),
      });
      console.log('📝 Email failure logged to Firestore');
    } catch (logError) {
      console.error('Failed to log email failure:', logError);
    }

    return { success: false, error: error?.message || 'Failed to send email' };
  }
}

// Check if Gmail is configured
export function isGmailConfigured(): boolean {
  return !!(
    GMAIL_CONFIG.clientId &&
    GMAIL_CONFIG.clientSecret &&
    GMAIL_CONFIG.refreshToken
  );
}

