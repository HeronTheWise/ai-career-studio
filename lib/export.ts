import { z } from 'zod';
export const exportSchema = z.object({
 title: z.string().trim().min(1).max(160),
 content: z.string().trim().min(1).max(30000),
 name: z.string().max(120).optional(),
 template: z.enum(['classic', 'modern', 'executive']).default('classic'),
});
export const sectionHeading = /^(SUMMARY|PROFESSIONAL SUMMARY|PROFILE|EXPERIENCE|WORK EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|LANGUAGES|CORE COMPETENCIES|COVER LETTER|LINKEDIN PROFILE|INTERVIEW PLAN|NEXT STEPS|RECRUITER EMAIL)$/i;
export const cleanLine = (line: string) => line.trim().replace(/^#{1,6}\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1');
export const filename = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'career-document';
