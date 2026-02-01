# Dhruvil Thummar — Portfolio

Live site: https://drthummar.me/

Minimal, fast personal site for showcasing work and sharing a quick contact channel. Built with semantic HTML and Tailwind CSS, with a lightweight serverless contact endpoint for form submissions via Cloudflare Pages Functions and MailChannels.

## Features
- Responsive, single-page layout optimized for fast static hosting (GitHub Pages friendly)
- Tailwind CSS pipeline (PostCSS + autoprefixer + cssnano) for a small production stylesheet
- Contact form backed by Cloudflare Pages Functions (`/api/contact`) using MailChannels for free email delivery

## Getting started
Prerequisites: Node.js 18+ and npm.

1. Install dependencies: `npm install`
2. Start Tailwind in watch mode while editing styles: `npm run watch:css`
3. Open `index.html` in a local server (e.g., `npx serve .`) to view changes.

## Build
- Generate the minified production CSS: `npm run build:css`
- The compiled CSS is written to `assets/tailwind.css`. Commit this file when deploying static hosting so the site works without the build step.

## Contact form backend

The Cloudflare Pages Function in `functions/api/contact.js` accepts POSTed JSON with `name`, `email`, `subject` (optional), and `message`. It sends two beautifully formatted emails using either **Resend** (recommended) or **MailChannels**:

1. **Owner notification** — All submission details to you
2. **Confirmation email** — Thank you message to the visitor

### Configuration (Choose One)

#### Option 1: Resend (Recommended - Easiest Setup)

1. Sign up for free at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Set in Cloudflare Pages (Settings → Environment Variables):
   - `RESEND_API_KEY=your_api_key_here`
   - `CONTACT_FROM=noreply@your-domain.com` (can be any domain)
   - `CONTACT_TO=your-email@your-domain.com`

**No DNS setup needed!** Resend handles everything.

#### Option 2: MailChannels (Free but Requires DNS Setup)

Set these environment variables in Cloudflare Pages (Settings → Environment Variables):

- `CONTACT_FROM` — sender email (must match your verified domain)
- `CONTACT_TO` — where owner notifications are sent
- `CONTACT_CC` (optional) — additional recipients (comma-separated)

Then add this SPF record to your domain's DNS:

```
Name: @ (or your subdomain)
Type: TXT
Value: v=spf1 a mx include:relay.mailchannels.net ~all
```

**Input validation:**
- `name`: 2–100 characters
- `email`: valid email format
- `message`: 10–5000 characters

## Project structure
- `index.html` — main static page with contact form
- `assets/tailwind-input.css` — source Tailwind entry
- `assets/tailwind.css` — generated, minified CSS artifact
- `functions/api/contact.js` — Cloudflare Pages Function for contact form (primary endpoint)
- `_routes.json` — routing configuration for Cloudflare Pages
- `tailwind.config.js`, `postcss.config.js` — build configuration

## Deployment
- Run `npm run build:css` before publishing so the compiled CSS is up to date.
- Push the static assets (including `assets/tailwind.css`) to your hosting platform (e.g., GitHub Pages or any static host).

## License
ISC — see `package.json` for details.

---

**Designed & Built by Dhruvil Thummar © 2025**