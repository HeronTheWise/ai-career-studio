import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { exportSchema, sectionHeading, cleanLine, filename } from '@/lib/export';
import { readJson } from '@/lib/http';
export const runtime = 'nodejs';
export const maxDuration = 30;
export async function POST(request: Request) {
 const raw = await readJson(request).catch(() => null);
 const parsed = exportSchema.safeParse(raw);
 if (!parsed.success) return Response.json({error: 'Enter a title and up to 30,000 characters of document text.'}, {status:400});
 try {
 const {title, content, name, template} = parsed.data;
 const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit);
 const [regularBytes,boldBytes] = await Promise.all(['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(f=>readFile(path.join(process.cwd(),'public','fonts',f))));
 const regular = await pdf.embedFont(regularBytes, {subset:true}); const bold = await pdf.embedFont(boldBytes,{subset:true});
 // Reject unsupported characters instead of silently exporting missing-glyph boxes.
 const supported = new Set(regular.getCharacterSet());
 if ([...title + (name || '') + content].some(c => !/\s/.test(c) && !supported.has(c.codePointAt(0)!)))
 return Response.json({error:'This PDF font does not support some characters. Please use DOCX for this document.'},{status:422});
 const accent = template === 'modern' ? rgb(.20,.32,.75) : template === 'executive' ? rgb(.12,.34,.29) : rgb(.12,.15,.20);
 let page = pdf.addPage([595.28,841.89]); let y = 788; const margin = 52; const width = 491;
 function newPage(){page=pdf.addPage([595.28,841.89]); y=788;}
 function draw(text:string,size:number,strong=false){
 const font=strong?bold:regular; let line='';
 const emit=()=>{if(y<60)newPage(); page.drawText(line,{x:margin,y,size,font,color:strong?accent:rgb(.16,.18,.22)});y-=size*1.5;line='';};
 // Character-level fallback handles long URLs and unbroken strings without clipping.
 for (const word of text.split(/\s+/)) {
 if(line && font.widthOfTextAtSize(line+' '+word,size)>width) emit();
 if(font.widthOfTextAtSize(word,size)>width){for(const c of word){if(font.widthOfTextAtSize(line+c,size)>width)emit();line+=c;}}
 else line+=(line?' ':'')+word;
 } if(line)emit();
 }
 pdf.setTitle(title); pdf.setAuthor(name || ''); pdf.setCreator('AI Career Studio');
 draw(name || title,22,true); if(name)draw(title,10); y-=12;
 for(const rawLine of content.split(/\r?\n/)){const line=cleanLine(rawLine); if(!line){y-=7;continue;}
 const heading=sectionHeading.test(line); if(heading){if(y<110)newPage();y-=10;} draw(line,heading?11:10,heading);}
 for(const [index,p] of pdf.getPages().entries()) p.drawText(String(index+1),{x:540,y:28,size:8,font:regular,color:rgb(.5,.5,.5)});
 const bytes=await pdf.save();
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${filename(title)}.pdf"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 } catch {return Response.json({error:'PDF export failed. Your text is still available; please try DOCX.'},{status:500});}
}
