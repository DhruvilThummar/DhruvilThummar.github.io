# Security Policy

## Supported versions
Security fixes are issued for the live site (the `main` branch). Archived tags or forks are not maintained.

| Version / branch | Supported |
| ---------------- | --------- |
| main (live site) | ✅        |
| older tags       | ❌        |

## Reporting a vulnerability
- Email: official@gujwear.live (preferred)
- Alternative: open a private GitHub Security Advisory for this repository.

When you report, please include:
- A clear description of the issue and its potential impact
- Steps to reproduce or a minimal proof of concept
- Affected URL(s), payloads, and any relevant request/response samples
- Optional: suggested remediation or references

Response expectations:
- Acknowledgment within 3 business days
- Status update within 7 business days after acknowledgment

## Handling process
1) Triage and reproduce; 2) Assess impact and scope; 3) Develop and test a fix; 4) Deploy and notify reporters; 5) Credit provided on request (unless anonymity is preferred).

## Scope and testing guidelines
- In scope: the public site, static assets, and `/api/contact` mailer function.
- Out of scope: denial-of-service tests, automated spam against the form, or attacks against third-party infrastructure.
- Please avoid accessing data that is not yours; stop testing and report immediately if you encounter sensitive information.
