import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
// Without configured Clerk credentials, every cloud entry point must fail closed.
for(const [path,method] of [['/api/profile','GET'],['/api/profile','PUT'],['/api/profile','DELETE'],['/api/documents','GET'],['/api/documents','POST'],['/api/documents/11111111-1111-4111-8111-111111111111','GET'],['/api/documents/11111111-1111-4111-8111-111111111111','DELETE']]){
 const r=await fetch(base+path,{method});assert.equal(r.status,503,`${method} ${path}`);
 const d=await r.json();assert.match(d.error,/sign-in is not configured/);assert.equal(r.headers.get('cache-control'),'private, no-store');
}
for(const path of ['/api/profile','/api/documents']){
 const r=await fetch(base+path,{method:'POST',headers:{origin:'https://untrusted.example'}});
 // Profile POST is not implemented; exercise PUT separately below.
 if(path==='/api/documents')assert.equal(r.status,403,'Foreign origin rejected');
}
const foreign=await fetch(base+'/api/profile',{method:'PUT',headers:{origin:'https://untrusted.example'}});assert.equal(foreign.status,403);
const status=await (await fetch(base+'/api/status')).json();assert.equal(status.accounts,false);assert.equal(status.generation,false);
console.log('PASS: all cloud APIs fail closed without auth configuration, private no-store responses, foreign-origin writes rejected, inactive services reported accurately.');
