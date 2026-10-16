import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const base=process.env.TEST_BASE_URL || 'http://localhost:3000';
const post=(route,data)=>fetch(base+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
for(const path of ['/','/builder','/workspace','/privacy','/terms']) assert.equal((await fetch(base+path)).status,200,path);
assert.equal((await post('/api/generate',{})).status,503,'Generation fails closed');
assert.equal((await post('/api/export/pdf',{})).status,400);
assert.equal((await post('/api/export/docx',{title:'Test',content:'a'.repeat(30001)})).status,400);
const data={title:'Resume',name:'Alex Martin',template:'modern',content:'SUMMARY\nExperienced product manager.\n\nEXPERIENCE\n- Delivered a product launch.\nEDUCATION\nExample University'};
for(const format of ['pdf','docx']){const r=await post('/api/export/'+format,data);assert.equal(r.status,200,await r.clone().text());const b=Buffer.from(await r.arrayBuffer());assert.ok(b.length>1000);assert.equal(b.subarray(0,format==='pdf'?4:2).toString(),format==='pdf'?'%PDF':'PK');}
assert.equal((await post('/api/export/pdf',{...data,content:'你好'})).status,422,'Unsupported glyphs reported');
const long=await post('/api/export/pdf',{...data,content:('EXPERIENCE\n'+ 'Long career achievement '.repeat(12)+'\n').repeat(50)});assert.equal(long.status,200);
console.log('PASS: pages, closed AI gate, validation, PDF/DOCX bytes, long PDF, glyph rejection');
if(process.argv.includes('--api-only')) process.exit(0);
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(base+'/builder');
 await page.getByLabel('Full name *',{exact:true}).fill('Alex Martin');await page.getByLabel('Email *',{exact:true}).fill('alex@example.com');await page.getByLabel('Target role *',{exact:true}).fill('Product manager');
 await page.getByRole('button',{name:'Create draft from my profile'}).click();await page.getByRole('button',{name:'Save version',exact:true}).click();
 await page.getByRole('link',{name:'My saved versions →'}).click();await page.getByRole('heading',{name:'Alex Martin — Resume'}).waitFor();
 await page.goto(base+'/builder');assert.match(await page.getByLabel('Document text; editable',{exact:true}).inputValue(),/Alex Martin/);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();assert.match((await download).suggestedFilename(),/\.pdf$/);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'No mobile horizontal overflow');
 console.log('PASS: pages, closed AI gate, validation, PDF/DOCX bytes, long PDF, glyph rejection, profile-to-draft, save/reload, browser download, mobile width');
}finally{await browser.close();}
