# Resend Email Setup Guide (Recommended)

Resend is the easiest way to send emails from your Cloudflare Pages contact form - **no DNS configuration needed!**

## Quick Setup (2 minutes)

### Step 1: Create a Resend Account

1. Go to https://resend.com
2. Sign up for a free account (includes free email sending)
3. Verify your email address

### Step 2: Get Your API Key

1. Log into your Resend dashboard
2. Go to **Settings → API Keys**
3. Click **Create API Key**
4. Copy the key (looks like: `re_xxxxxxxxxxxxxxxx`)

### Step 3: Add to Cloudflare Pages

1. Go to your Cloudflare Pages project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these production variables:
   - `RESEND_API_KEY`: Paste your API key from Step 2
   - `CONTACT_FROM`: `noreply@your-domain.com` (or any domain you own)
   - `CONTACT_TO`: `your-email@your-domain.com` (where you receive notifications)

### Step 4: Deploy

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Cloudflare Pages will auto-deploy
3. Test the contact form on your site

## That's it! ✅

Your contact form emails will now work without any DNS configuration.

## Troubleshooting

### Email Still Not Working?

1. **Check API Key**: Make sure you copied the full API key correctly
2. **Verify Domain**: The CONTACT_FROM email domain should be one you own
3. **Check Logs**: 
   - Go to Cloudflare Pages → Deployments → Latest → View build log
   - Look for error messages

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check your API key is correct |
| 400 Bad Request | Verify CONTACT_FROM email format |
| 422 Unprocessable | The CONTACT_TO email might be invalid |

## Alternative: MailChannels

If you prefer MailChannels (free, requires DNS setup):
- See [MAILCHANNELS_SETUP.md](MAILCHANNELS_SETUP.md)

## Resend Features (Free Tier)

✅ 100 emails per day
✅ Beautiful email templates
✅ Reply-To support
✅ CC/BCC support
✅ HTML and plain text emails
✅ Delivery tracking
✅ No DNS changes needed

## Support

For Resend issues: https://resend.com/docs
For Cloudflare issues: https://developers.cloudflare.com/pages/

---

**Recommended**: Use Resend for the simplest setup! ⚡
