import { z } from 'zod';

export const experienceSchema = z.object({
  role: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(160),
  location: z.string().trim().max(120).optional().default(''),
  startDate: z.string().max(30).optional().default(''),
  endDate: z.string().max(30).optional().default(''),
  achievements: z.array(z.string().trim().max(500)).max(12).default([]),
});
export const careerProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional().default(''),
  location: z.string().max(120).optional().default(''),
  targetRole: z.string().trim().min(1).max(120),
  summary: z.string().max(1600).optional().default(''),
  skills: z.array(z.string().trim().max(80)).max(60).default([]),
  experience: z.array(experienceSchema).max(30).default([]),
  education: z.array(z.object({ institution: z.string().max(180), qualification: z.string().max(180), year: z.string().max(20).optional() })).max(20).default([]),
  locale: z.string().max(20).default('en-US'),
});
export const generationSchema = z.object({
  documentType: z.enum(['RESUME','COVER_LETTER','LINKEDIN_PROFILE','RECRUITER_EMAIL','INTERVIEW_PLAN']),
  profile: careerProfileSchema,
  jobDescription: z.string().max(12000).optional().default(''),
  tone: z.enum(['professional','confident','concise']).default('professional'),
});
export type CareerProfileInput = z.infer<typeof careerProfileSchema>;
