import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';
import { readJson } from '@/lib/http';
import { z } from 'zod';

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function db() {
 if (!process.env.DATABASE_URL) throw new ApiError(503,'Cloud storage is temporarily unavailable.');
 return neon(process.env.DATABASE_URL);
}
export async function accountId() {
 if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) throw new ApiError(503,'Account sign-in is not configured yet.');
 const { userId } = await auth();
 if (!userId) throw new ApiError(401,'Sign in to use your cloud workspace.');
 return userId;
}
export function checkOrigin(request: Request) {
 const origin = request.headers.get('origin');
 if (origin && origin !== new URL(request.url).origin) throw new ApiError(403,'This request must come from this application.');
}
export function json(data: unknown, status=200) { return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}}); }
export async function withAccount(request: Request, action: (userId:string)=>Promise<Response>) {
 try { if (!['GET','HEAD'].includes(request.method)) checkOrigin(request); return await action(await accountId()); }
 catch (error) { return json({error:error instanceof ApiError ? error.message : 'Cloud request failed. Please try again.'},error instanceof ApiError ? error.status : 503); }
}
export async function body<T extends z.ZodTypeAny>(request:Request,schema:T):Promise<z.infer<T>> {
 const value = await readJson(request).catch(()=>null);
 const parsed = schema.safeParse(value);
 if (!parsed.success) throw new ApiError(400,'Please check your document fields and try again.');
 return parsed.data;
}
export const draftSchema = z.object({
 docType:z.enum(['RESUME','COVER_LETTER','LINKEDIN_PROFILE','RECRUITER_EMAIL','INTERVIEW_PLAN']),
 template:z.enum(['classic','modern','executive']),
 fullName:z.string().max(120),email:z.string().max(254),phone:z.string().max(40),location:z.string().max(120),targetRole:z.string().max(120),
 summary:z.string().max(1600),skills:z.string().max(5000),education:z.string().max(5000),jobDescription:z.string().max(12000),
 tone:z.enum(['professional','confident','concise']),content:z.string().max(30000),
 experience:z.array(z.object({role:z.string().max(120),company:z.string().max(160),startDate:z.string().max(30),endDate:z.string().max(30),achievements:z.string().max(6000)})).max(30)
});
export const documentSchema = z.object({title:z.string().trim().min(1).max(160),draft:draftSchema}).refine(d=>d.draft.content.trim().length>0);
export async function reserveGeneration(userId:string) {
 const sql=db();
 const rows = await sql`INSERT INTO career_generation_usage (user_id,usage_day,attempts,last_attempt_at)
 VALUES (${userId},(now() AT TIME ZONE 'UTC')::date,1,now())
 ON CONFLICT (user_id,usage_day) DO UPDATE SET attempts=career_generation_usage.attempts+1,last_attempt_at=now()
 WHERE career_generation_usage.attempts<5 AND career_generation_usage.last_attempt_at<now()-interval '15 seconds'
 RETURNING attempts,usage_day::text`;
 if (!rows.length) {
  const usage=await sql`SELECT attempts,GREATEST(1,CEIL(EXTRACT(EPOCH FROM last_attempt_at+interval '15 seconds'-now())))::int AS wait_seconds FROM career_generation_usage WHERE user_id=${userId} AND usage_day=(now() AT TIME ZONE 'UTC')::date`;
  if(Number(usage[0]?.attempts)>=5)throw new ApiError(429,'Your daily generation allowance is used. It resets at 00:00 UTC (5:30 AM India time).');
  throw new ApiError(429,`Please wait ${Number(usage[0]?.wait_seconds)||15} seconds before generating again.`);
 }
 return {usageDay:String(rows[0].usage_day)};
}

export async function releaseGeneration(userId:string,usageDay:string){
 // Refund only this reservation's UTC day, including when the request crosses midnight.
 // Preserve last_attempt_at so failed calls still respect the cooldown.
 await db()`UPDATE career_generation_usage SET attempts=GREATEST(0,attempts-1) WHERE user_id=${userId} AND usage_day=${usageDay}::date`;
}
