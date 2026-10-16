export const dynamic = 'force-dynamic';
export function GET() {
 const checks = {
  aiEnabled: process.env.ENABLE_AI_GENERATION?.trim().toLowerCase() === 'true',
  providerKey: !!(process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()),
  accountKey: !!process.env.CLERK_SECRET_KEY?.trim(),
  publishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
  database: !!process.env.DATABASE_URL?.trim(),
 };
 const missing = Object.entries(checks).filter(([,ready])=>!ready).map(([name])=>name);
 return Response.json({generation:missing.length===0,checks,missing,accounts:checks.accountKey&&checks.publishableKey,cloudStorage:checks.database,generationDailyLimit:5,payments:false,exports:['pdf','docx'],release:'ai-status-v2'}, {headers:{'Cache-Control':'private, no-store, max-age=0'}});
}
