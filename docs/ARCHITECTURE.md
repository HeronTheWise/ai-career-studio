# Architecture and implementation plan

## Product principles
- Never fabricate employment history, dates, education, credentials, skills or quantified results.
- Keep AI output editable; label any inferred or suggested content for user confirmation.
- Payment status must be confirmed by a signed server-side provider webhook, never by a browser redirect.
- Private documents are stored in private object storage; downloads use short-lived signed URLs after ownership/entitlement checks.
- Make data export and deletion available; define retention before launch.

## Proposed production architecture
1. Next.js web application (marketing, authenticated workspace, editor, admin dashboard).
2. Auth provider (managed authentication; require verified email and secure sessions).
3. PostgreSQL via Prisma for profiles, documents, orders, generation jobs and audit events.
4. AI provider adapter behind a server-side interface; structured JSON output and Zod validation.
5. Background queue for generation and export; n8n can orchestrate email, retries, support alerts and analytics, but is not the security boundary.
6. Document renderer: HTML templates for preview/PDF and a tested DOCX generation library; visual regression tests for pagination.
7. Private S3-compatible storage for exports; short-lived signed download links.
8. Payment provider adapter, idempotent order creation, webhook signature verification, replay protection and reconciliation.
9. Email provider for receipts and delivery notifications; transactional emails separated from marketing consent.
10. Observability: structured logs, error reporting, usage/cost dashboards, uptime checks and alerts.

## Suggested implementation milestones
- M0: Confirm brand/domain, launch jurisdictions, privacy/retention policy, payment provider and target document formats.
- M1: Marketing site, design system, responsive UI and user research with 8–12 target customers.
- M2: Authentication, career profile CRUD, document schema, version history and deletion/export.
- M3: AI provider adapter, prompt tests, structured outputs, factuality warnings, job-description tailoring and usage quotas.
- M4: Three carefully tested templates, PDF/DOCX exports, page-break handling and accessibility checks.
- M5: Checkout, signed webhooks, entitlements, refund/admin flow and transactional email.
- M6: Admin dashboard, abuse controls, rate limits, monitoring, backups, restore drill and security review.
- M7: Private beta, paid conversion experiment, then staged public launch.

## Current repository status
This repository is a starter scaffold: marketing page, initial Prisma data model, request validation and prompt policy are present. The AI API route intentionally returns 501 until a real provider adapter and production security controls are implemented. Authentication, payment, export generation, storage, admin authorization and n8n workflows are not yet connected. Do not deploy this as a transactional production service in its current state.
