import { body, db, documentSchema, json, withAccount } from '@/lib/backend';
import { randomUUID } from 'node:crypto';
export const runtime='nodejs';
export async function GET(request:Request) { return withAccount(request,async userId=>{
 const rows=await db()`SELECT id,title,template,left(content,180) AS excerpt,created_at FROM career_documents WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 100`;
 return json({documents:rows});
}); }
export async function POST(request:Request) { return withAccount(request,async userId=>{
 const input=await body(request,documentSchema);const id=randomUUID();
 await db()`INSERT INTO career_documents(id,user_id,title,content,template,draft) VALUES(${id},${userId},${input.title},${input.draft.content},${input.draft.template},${JSON.stringify(input.draft)}::jsonb)`;
 return json({id},201);
}); }
