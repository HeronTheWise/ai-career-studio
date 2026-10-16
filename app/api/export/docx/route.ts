import { NextResponse } from 'next/server';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { exportSchema, sectionHeading, cleanLine } from '@/lib/export';
import { readJson } from '@/lib/http';

export const runtime = 'nodejs';
const schema = exportSchema;

export async function POST(request: Request) {
  const raw = await readJson(request).catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'A title and document content are required.' }, { status: 400 });
  const { title, content, name, template } = parsed.data;
  const paragraphs = content.split(/\r?\n/).map((line) => {
    const value = cleanLine(line);
    if (!value) return new Paragraph({ children: [new TextRun('')] });
    if (sectionHeading.test(value)) {
      return new Paragraph({ text: value, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 } });
    }
    if (/^(•|\-|\*)\s+/.test(value)) return new Paragraph({ text: value.replace(/^(•|\-|\*)\s+/, ''), bullet: { level: 0 }, spacing: { after: 70 } });
    return new Paragraph({ children: [new TextRun(value)], spacing: { after: 100 } });
  });
  const color = template === 'modern' ? '3352BF' : template === 'executive' ? '1F574A' : '1F2633';
  const doc = new Document({ styles: { default: { document: { run: { font: 'Calibri', size: 22 } }, heading2: { run: { color, bold: true, size: 24 } }, title: { run: { color, size: 40 } } } }, creator: 'AI Career Studio', title, sections: [{ properties: {}, children: [new Paragraph({ text: title, heading: HeadingLevel.TITLE }), ...(name ? [new Paragraph({ text: name, spacing: { after: 180 } })] : []), ...paragraphs] }] });
  const buffer = await Packer.toBuffer(doc);
  const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'career-document';
  return new Response(new Uint8Array(buffer), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="${safeName}.docx"`, 'Cache-Control': 'no-store' } });
}
