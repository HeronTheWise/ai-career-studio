import { providerError } from '@/lib/provider-error';
import { accountId, checkOrigin, reserveGeneration, releaseGeneration, ApiError } from '@/lib/backend';
import { readJson } from '@/lib/http';
import { NextResponse } from 'next/server';
import { generationSchema } from '@/lib/validation';
import { buildCareerPrompt } from '@/lib/ai-prompt';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  if (process.env.ENABLE_AI_GENERATION?.trim().toLowerCase() !== 'true') return NextResponse.json({ error: 'AI generation is not available yet. You can write, edit, and export your document now.' }, { status: 503 });
  const body = await readJson(request).catch(() => null);
  const parsed = generationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the required fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI generation is temporarily unavailable. Please try again later.' }, { status: 503 });

  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const baseUrl = (process.env.AI_BASE_URL || (provider === 'openai' ? 'https://api.openai.com/v1' : '')).replace(/\/$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  if (!baseUrl) return NextResponse.json({ error: 'Set AI_BASE_URL for your selected AI provider.' }, { status: 503 });

  let reservation: {userId:string;usageDay:string}|undefined;
  let succeeded=false;
  try {
    checkOrigin(request);
    const userId = await accountId();
    const reserved=await reserveGeneration(userId);
    reservation={userId,usageDay:reserved.usageDay};
    const prompt = buildCareerPrompt(parsed.data.profile, parsed.data.documentType, parsed.data.jobDescription, parsed.data.tone);
    const response = await fetch(`${baseUrl}/chat/completions`, {
      signal: AbortSignal.timeout(25000),
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, temperature: 0.45, max_completion_tokens: 4000, messages: [
        { role: 'system', content: 'You are an expert global career-document editor. Return only useful document content, with clear headings and concise bullets. Never invent employers, qualifications, metrics, dates, skills, certifications, or achievements. If information is missing, omit it or use a clear [ADD DETAIL] placeholder. Do not claim a resume guarantees ATS success or interviews.' },
        { role: 'user', content: prompt }
      ] })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const failure=providerError(response.status,payload,response.headers.get('retry-after'));
      // Fixed categories only; never log the raw provider error, credentials, or profile.
      console.warn('ai_provider_failure',{status:response.status,category:failure.code});
      return NextResponse.json({error:failure.message,code:failure.code},{status:failure.status,headers:failure.retryAfter?{'Retry-After':String(failure.retryAfter),'Cache-Control':'no-store'}:{'Cache-Control':'no-store'}});
    }
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim() || content.length > 30000) return NextResponse.json({ error: 'The AI provider returned an empty response. Please try again.' }, { status: 502 });
    succeeded=true;
    return NextResponse.json({ content: content.trim(), model, documentType: parsed.data.documentType });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({error:error.message},{status:error.status});
    return NextResponse.json({ error: 'Could not reach the AI provider. Please try again in a moment.' }, { status: 502 });
  } finally {
    if(reservation&&!succeeded){
      await releaseGeneration(reservation.userId,reservation.usageDay).catch(()=>console.error('generation_reservation_release_failed'));
    }
  }
}
