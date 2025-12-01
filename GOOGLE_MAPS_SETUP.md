# Google Maps Places API Setup Guide

This guide will help you set up Google Maps Places API for the business location autocomplete feature in the resume page.

## 🎯 What This Feature Does

The **PlaceAutocomplete** component allows candidates to search for and select their workplace from Google's database of businesses. This is especially useful for the hospitality industry where candidates work at specific physical locations (e.g., "Starbucks Universidad", "Hotel Marriott Reforma", etc.).

## 📋 Prerequisites

- A Google Cloud account (free tier available)
- A credit card (required for verification, but won't be charged unless you exceed free limits)

## 🚀 Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Enter a project name (e.g., "TalentFlow HR Portal")
5. Click "Create"

### 2. Enable Places API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Places API"
3. Click on "Places API"
4. Click "Enable"

### 3. Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "API Key"
3. Your API key will be created and displayed
4. **IMPORTANT**: Click "Restrict Key" immediately for security

### 4. Restrict the API Key (IMPORTANT for Security)

#### Application Restrictions:
1. Select "HTTP referrers (web sites)"
2. Add your domains:
   - `localhost:*` (for development)
   - `*.vercel.app` (if deploying to Vercel)
   - Your production domain (e.g., `yourapp.com`, `*.yourapp.com`)

#### API Restrictions:
1. Select "Restrict key"
2. Choose **only** "Places API" from the dropdown
3. Click "Save"

### 5. Add API Key to Your Project

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following line:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with your actual API key.

**Example:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6. Restart Your Development Server

After adding the environment variable, restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 💰 Pricing & Free Tier

### Free Tier
- **$200 free credit per month** from Google Cloud
- This equals approximately **70,000 autocomplete requests per month**
- More than enough for most applications

### After Free Tier
- **Places Autocomplete**: $2.83 per 1,000 requests
- **Optimizations included in our implementation:**
  - Debouncing (waits 300ms before API call)
  - Session tokens to batch requests
  - Restricted to establishments only (reduces noise)
  - Region restriction to Latin America + US

### Cost Example
- 100 users filling out resumes/month = ~500 searches
- 500 searches × 5 keystrokes each = 2,500 requests
- **2,500 requests = $7/month** (well within free tier)

## 🔒 Security Best Practices

### ✅ DO:
- Restrict your API key to specific domains
- Restrict to only Places API
- Use environment variables (never commit API keys)
- Monitor usage in Google Cloud Console
- Set up billing alerts

### ❌ DON'T:
- Commit API keys to git
- Share API keys publicly
- Use unrestricted API keys
- Skip the restriction steps

## 🧪 Testing the Implementation

1. Navigate to `/candidate/resume` in your app
2. Click to add a new work experience
3. In the "Empresa / Negocio" field, start typing a business name
4. You should see autocomplete suggestions appear
5. Select a business from the dropdown
6. The full name and address should populate

### Example Searches to Test:
- "Starbucks"
- "Hotel Marriott"
- "Restaurante"
- "Café"

## 🐛 Troubleshooting

### Issue: "Google Maps API key no configurada"
**Solution**: Make sure you've added `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your `.env.local` file and restarted the server.

### Issue: "Error al cargar Google Maps API"
**Solutions**:
1. Check that Places API is enabled in Google Cloud Console
2. Verify your API key is correct
3. Check that your domain is allowed in API key restrictions
4. Check browser console for specific error messages

### Issue: Autocomplete not working
**Solutions**:
1. Open browser DevTools → Console and check for errors
2. Verify Places API is enabled
3. Check API key restrictions (may be too restrictive)
4. Ensure billing is enabled in Google Cloud (required for API usage)

### Issue: "This API project is not authorized to use this API"
**Solution**: Go to Google Cloud Console → APIs & Services → Library → Enable "Places API"

## 📊 Monitoring Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Dashboard**
4. Click on "Places API"
5. View your usage metrics and quotas

## 🔔 Set Up Billing Alerts (Recommended)

1. Go to **Billing** → **Budgets & alerts**
2. Click "Create Budget"
3. Set a budget (e.g., $10/month)
4. Set alerts at 50%, 90%, and 100%
5. Enter your email for notifications

This ensures you'll be notified if usage exceeds expectations.

## 🌍 Supported Countries

The autocomplete is currently configured for:
- 🇲🇽 Mexico
- 🇺🇸 United States
- 🇨🇴 Colombia
- 🇦🇷 Argentina
- 🇵🇪 Peru
- 🇨🇱 Chile
- 🇧🇷 Brazil

To add more countries, edit the `componentRestrictions` in `/src/components/ui/PlaceAutocomplete.tsx`.

## 📚 Additional Resources

- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Places Autocomplete Pricing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Google Cloud Free Tier](https://cloud.google.com/free)

## ✅ Verification Checklist

- [ ] Google Cloud Project created
- [ ] Places API enabled
- [ ] API Key created
- [ ] API Key restricted (HTTP referrers + Places API only)
- [ ] Environment variable added to `.env.local`
- [ ] Development server restarted
- [ ] Feature tested and working
- [ ] Billing alerts set up

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify all steps above are completed
3. Check Google Cloud Console for API errors
4. Review the troubleshooting section

---

**Last Updated**: December 2025

