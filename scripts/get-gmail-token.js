/**
 * Gmail API - One-Time OAuth Setup Script
 *
 * This script helps you authenticate mesereamx@gmail.com and get a refresh token.
 * You only need to run this ONCE!
 *
 * Usage:
 *   node scripts/get-gmail-token.js
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Load OAuth credentials
const credentialsPath = path.join(__dirname, '..', 'gmail_api_secrets.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const { client_id, client_secret, redirect_uris } = credentials.web;
// Use the first redirect URI from the credentials file, or default to localhost
const redirect_uri = redirect_uris?.[0] || 'http://localhost:3000/oauth2callback';

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);

// Gmail API scope - only need to send emails
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

console.log('\n🔐 Gmail API OAuth Setup\n');
console.log('This script will help you authenticate mesereamx@gmail.com');
console.log('and get a refresh token for sending emails.\n');

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Force to get refresh token
});

console.log('📋 Step 1: Authorize this app by visiting this URL:\n');
console.log(authUrl);
console.log('\n');

// Create temporary server to receive the code
const server = http.createServer(async (req, res) => {
  try {
    if (req.url.indexOf('/oauth2callback') > -1) {
      const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
      const code = qs.get('code');

      if (!code) {
        res.end('❌ No authorization code received. Please try again.');
        return;
      }

      console.log('✅ Authorization code received!');
      console.log('🔄 Exchanging code for tokens...\n');

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      console.log('✅ Tokens received!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 SAVE THIS REFRESH TOKEN:\n');
      console.log(tokens.refresh_token);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📋 Add this to your .env.local file:\n');
      console.log(`GMAIL_CLIENT_ID="${client_id}"`);
      console.log(`GMAIL_CLIENT_SECRET="${client_secret}"`);
      console.log(`GMAIL_REFRESH_TOKEN="${tokens.refresh_token}"`);
      console.log(`GMAIL_USER_EMAIL="mesereamx@gmail.com"`);
      console.log('\n✅ Setup complete! You can close this window.\n');

      // Send success response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gmail API Setup Complete</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            .success {
              color: #10b981;
              font-size: 48px;
              margin-bottom: 20px;
            }
            .message {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
            }
            .code {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              font-family: monospace;
              font-size: 12px;
              text-align: left;
              margin: 20px 0;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="success">✅</div>
          <div class="message">
            <h1>Gmail API Setup Complete!</h1>
            <p>Your refresh token has been generated.</p>
            <p><strong>Check your terminal for the token and instructions.</strong></p>
          </div>
          <div class="code">
            Refresh Token: ${tokens.refresh_token}
          </div>
          <p>You can close this window now.</p>
        </body>
        </html>
      `);

      // Close server after successful auth
      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);
    }
  } catch (error) {
    console.error('❌ Error during authentication:', error);
    res.end('❌ Authentication failed. Check terminal for details.');
    server.close();
    process.exit(1);
  }
});

// Start server
server.listen(3000, () => {
  console.log('🌐 Local server started on http://localhost:3000');
  console.log('👉 Please COPY and OPEN the URL shown above in your browser.');
  console.log('⏳ Waiting for you to complete authentication...\n');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('❌ Port 3000 is already in use.');
    console.error('Please stop your dev server and try again.');
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

