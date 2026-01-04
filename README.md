# Dhruvil Thummar — Portfolio

Live site: https://drthummar.me/

Minimal, fast personal site for showcasing work and sharing a quick contact channel. Built with semantic HTML and Tailwind CSS, with a lightweight serverless contact endpoint for form submissions.

## Features
- Responsive, single-page layout optimized for fast static hosting (GitHub Pages friendly)
- Tailwind CSS pipeline (PostCSS + autoprefixer + cssnano) for a small production stylesheet
- Contact form backed by `/api/contact` using Nodemailer with SMTP credentials supplied via environment variables

## Getting started
Prerequisites: Node.js 18+ and npm.

1. Install dependencies: `npm install`
2. Start Tailwind in watch mode while editing styles: `npm run watch:css`
3. Open `index.html` in a local server (e.g., `npx serve .`) to view changes.

## Build
- Generate the minified production CSS: `npm run build:css`
- The compiled CSS is written to `assets/tailwind.css`. Commit this file when deploying static hosting so the site works without the build step.

## Contact form backend
The serverless function in `api/contact.js` accepts POSTed JSON with `name`, `email`, `subject` (optional), and `message`. It sends two beautifully formatted emails:

1. **Owner notification** — All submission details to you
2. **Confirmation email** — Thank you message to the visitor

Configure via environment variables:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` — SMTP server details
- `SMTP_USER`, `SMTP_PASS` — SMTP credentials
- `SMTP_FROM` — sender address (defaults to `official@dhruvilthummar.me`)
- `NOTIFY_EMAIL` — where owner notifications are sent (defaults to `official@dhruvilthummar.me`)

**Input validation:**
- `name`: 2–100 characters
- `email`: valid email format
- `message`: 10–5000 characters

If SMTP variables are missing, submissions are logged instead of sent to avoid silent failures. Always use environment variables for production credentials—never hardcode them.

## Project structure
- `index.html` — main static page
- `assets/tailwind-input.css` — source Tailwind entry
- `assets/tailwind.css` — generated, minified CSS artifact
- `api/contact.js` — serverless handler for contact form delivery
- `tailwind.config.js`, `postcss.config.js` — build configuration

## Deployment
- Run `npm run build:css` before publishing so the compiled CSS is up to date.
- Push the static assets (including `assets/tailwind.css`) to your hosting platform (e.g., GitHub Pages or any static host).

## License
ISC — see `package.json` for details.

---

**Designed & Built by Dhruvil Thummar © 2025**