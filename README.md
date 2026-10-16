# AI Career Studio — account and cloud workspace beta

## Active backend
- Clerk sign-in/sign-up via `/sign-in` and `/sign-up`; account ownership is enforced in every cloud API handler.
- Neon Postgres tables: `career_profiles`, `career_documents`, `career_generation_usage`.
- Profile GET/PUT/DELETE; document list/create/read/delete. Document versions are immutable snapshots.
- Builder: Save cloud version, Save profile, Load profile; workspace: open/delete cloud versions. Local drafts remain independent.
- AI requires Clerk authentication and an atomic Postgres attempt reservation: 5 attempts/account/UTC day, with 15 seconds between attempts. Failed provider requests release their reservation; cooldown still applies. Previously counted attempts are not reset. AI remains off until configured.
- PDF/DOCX exports remain available under existing Vercel deployment protection.

## Deploy
Use existing Vercel project `prj_oTGyStJLGyWzF13JFEvsUxgBLV0t`, Node 24, `npm ci`, build command `npm run build:vercel`.
The build applies the additive, repeatable SQL migration in `db/001_backend.sql` before compiling. A migration failure blocks deployment. There are no destructive schema changes.
Required server variables: `DATABASE_URL`, `CLERK_SECRET_KEY`. Required client key: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Integrations provision these in Vercel; never commit their values.
Configure the Clerk application domain and allowed redirects for your final domain before switching to production Clerk keys.

## AI activation
Set `AI_API_KEY` or `OPENAI_API_KEY`, optional `AI_BASE_URL`, and `AI_MODEL` in Vercel. Set `ENABLE_AI_GENERATION=true` only after verifying sign-in and cloud saving. Model calls never receive browser-supplied credentials or an account identifier. Review provider privacy and billing settings before using customer data.

## Local verification
`npm ci`, `npm run build`, then `npm start -- --hostname 127.0.0.1`.
`TEST_BASE_URL=http://127.0.0.1:3000 node tests/smoke.mjs --api-only` verifies the original editor/export APIs with AI off.
With provider environment variables configured, test two distinct Clerk users: save a version as A, read/delete its ID as B (404), reopen as A, delete as A, verify it disappears. Check profile isolation the same way. No test endpoint or authentication bypass is installed.

## Limits
No payments or paid entitlements. No automatic cloud autosave: save a new cloud version explicitly. Workspace displays the latest 100 versions. Cloud profile deletion does not delete saved documents or the Clerk account. Delete those separately; account-wide lifecycle automation is a future task.
Prisma's earlier schema remains an architecture draft; this release uses the SQL migration above, not Prisma migrations.
PDF has Latin/Greek/Cyrillic coverage; use DOCX for unsupported scripts. Keep important downloaded copies.
