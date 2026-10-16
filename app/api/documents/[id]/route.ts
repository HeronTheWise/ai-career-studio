import { ApiError, db, json, withAccount } from '@/lib/backend';
import { z } from 'zod';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
async function documentId(context:Context){const {id}=await context.params;if(!z.string().uuid().safeParse(id).success)throw new ApiError(404,'Document not found.');return id;}
export async function GET(request:Request,context:Context){return withAccount(request,async userId=>{
 const id=await documentId(context);const rows=await db()`SELECT id,title,draft,created_at FROM career_documents WHERE id=${id}::uuid AND user_id=${userId}`;
 if(!rows.length)throw new ApiError(404,'Document not found.');return json({document:rows[0]});
});}
export async function DELETE(request:Request,context:Context){return withAccount(request,async userId=>{
 const id=await documentId(context);const rows=await db()`DELETE FROM career_documents WHERE id=${id}::uuid AND user_id=${userId} RETURNING id`;
 if(!rows.length)throw new ApiError(404,'Document not found.');return json({deleted:true});
});}
