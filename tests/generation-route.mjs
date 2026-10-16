import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const providerModule={exports:{}};vm.runInNewContext(compile(await readFile('lib/provider-error.ts','utf8')),{exports:providerModule.exports,module:providerModule,Date});
const source=compile(await readFile('app/api/generate/route.ts','utf8'));
async function scenario({upstreamStatus=200,payload={choices:[{message:{content:'A real document'}}]},reserveFails=false,networkFails=false,refundFails=false}={}){
 const refunds=[];let calls=0;class ApiError extends Error{constructor(status,message){super(message);this.status=status;}}
 const backend={accountId:async()=> 'user-A',checkOrigin:()=>{},reserveGeneration:async()=>{if(reserveFails)throw new ApiError(429,'Cooldown');return {usageDay:'2026-10-15'};},releaseGeneration:async(...args)=>{refunds.push(args);if(refundFails)throw new Error('DB unavailable');},ApiError};
 const modules={'@/lib/backend':backend,'@/lib/http':{readJson:async()=>({})},'@/lib/validation':{generationSchema:{safeParse:()=>({success:true,data:{profile:{},documentType:'RESUME',jobDescription:'',tone:'professional'}})}},'@/lib/ai-prompt':{buildCareerPrompt:()=> 'test'},'@/lib/provider-error':providerModule.exports,'next/server':{NextResponse:{json:(data,init)=>Response.json(data,init)}}};
 const module={exports:{}};const context={module,exports:module.exports,require:name=>{assert.ok(modules[name],name);return modules[name];},process:{env:{ENABLE_AI_GENERATION:'true',OPENAI_API_KEY:'dummy-test-key'}},AbortSignal,console:{warn(){},error(){}},fetch:async()=>{calls++;if(networkFails)throw new Error('Timeout');return Response.json(payload,{status:upstreamStatus});}};
 vm.runInNewContext(source,context);const response=await module.exports.POST(new Request('https://app.example/api/generate',{method:'POST'}));return {status:response.status,body:await response.json(),refunds,calls};
}
let result=await scenario();assert.equal(result.status,200);assert.equal(result.refunds.length,0);
result=await scenario({upstreamStatus:429,payload:{error:{code:'insufficient_quota'}}});assert.equal(result.status,503);assert.equal(result.body.code,'AI_QUOTA_UNAVAILABLE');assert.deepEqual(result.refunds,[['user-A','2026-10-15']]);
result=await scenario({upstreamStatus:429,payload:{error:{code:'rate_limit_exceeded'}}});assert.equal(result.body.code,'AI_RATE_LIMIT');assert.equal(result.refunds.length,1);
result=await scenario({networkFails:true});assert.equal(result.status,502);assert.equal(result.refunds.length,1);
result=await scenario({payload:{choices:[]}});assert.equal(result.status,502);assert.equal(result.refunds.length,1);
result=await scenario({reserveFails:true});assert.equal(result.status,429);assert.equal(result.calls,0);assert.equal(result.refunds.length,0);
result=await scenario({upstreamStatus:429,payload:{error:{code:'insufficient_quota'}},refundFails:true});assert.equal(result.status,503);assert.equal(result.refunds.length,1);
console.log('PASS: successful calls retain quota; provider, output and network failures release exactly once to the original UTC day; denied reservations never call provider; refund errors preserve the primary error.');
