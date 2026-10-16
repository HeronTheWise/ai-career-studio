import type { CareerProfileInput } from './validation';

export function buildCareerPrompt(profile: CareerProfileInput, documentType: string, jobDescription: string, tone: string) {
  return `You are a careful career-document editor. Return clean, copy-ready plain text with useful headings and bullets. Do not wrap the answer in JSON or Markdown code fences.\n` +
    `RULES: Never invent employers, dates, degrees, certifications, metrics, skills, responsibilities, or achievements. Use only facts in the supplied profile. If a useful detail is missing, ask a question or mark it as a suggestion requiring confirmation. Tailor language to the job description without copying long phrases. Avoid claims of guaranteed interviews, ATS scores, or hiring outcomes. Use clear, inclusive, region-appropriate language.\n` +
    `Document type: ${documentType}. Tone: ${tone}. Locale: ${profile.locale}.\n` +
    `Profile JSON: ${JSON.stringify(profile)}\nJob description: ${jobDescription || '(not provided)'}\n` +
    `Use a professional document structure appropriate to the requested document type. Include a short “Details to confirm” section only if the supplied facts are insufficient. Keep content concise, truthful, and editable.`;
}
