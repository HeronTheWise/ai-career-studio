import { body, db, json, withAccount } from '@/lib/backend';
import { careerProfileSchema } from '@/lib/validation';
export const runtime='nodejs';
export async function GET(request:Request) { return withAccount(request,async userId=>{
 const rows=await db()`SELECT data,updated_at FROM career_profiles WHERE user_id=${userId}`;
 return json({profile:rows[0]?.data??null});
}); }
export async function PUT(request:Request) { return withAccount(request,async userId=>{
 const profile=await body(request,careerProfileSchema);
 await db()`INSERT INTO career_profiles(user_id,data) VALUES(${userId},${JSON.stringify(profile)}::jsonb) ON CONFLICT(user_id) DO UPDATE SET data=EXCLUDED.data,updated_at=now()`;
 return json({saved:true});
}); }
export async function DELETE(request:Request) { return withAccount(request,async userId=>{
 await db()`DELETE FROM career_profiles WHERE user_id=${userId}`;return json({deleted:true});
}); }
