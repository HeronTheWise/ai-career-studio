// Do not return provider messages: they may contain account identifiers or request content.
export function providerError(status:number,payload:unknown,retryHeader:string|null) {
 const error=(payload as {error?:{code?:unknown;type?:unknown}}|null)?.error;
 const code=typeof error?.code==='string'?error.code:'';
 const type=typeof error?.type==='string'?error.type:'';
 const billingCodes=['insufficient_quota','credit_balance_exhausted','organization_spend_limit_exceeded','project_spend_limit_exceeded','organization_usage_limit_exceeded'];
 if(billingCodes.includes(code)||type==='insufficient_quota')return {status:503,code:'AI_QUOTA_UNAVAILABLE',message:'AI provider credits or usage limits are exhausted. The site owner must check OpenAI API billing and project limits before generation can work. Waiting or retrying will not resolve this.',retryAfter:undefined};
 const parsed=retryHeader ? (/^\d+(\.\d+)?$/.test(retryHeader)?Number(retryHeader):Math.ceil((Date.parse(retryHeader)-Date.now())/1000)):NaN;
 const retryAfter=Number.isFinite(parsed)?Math.max(1,Math.ceil(parsed)):60;
 if(status===429)return {status:429,code:'AI_RATE_LIMIT',message:`The AI provider is rate-limiting requests. Try again in ${retryAfter} seconds. This failure does not use your daily allowance.`,retryAfter};
 if(status===401||status===403)return {status:503,code:'AI_AUTH_CONFIGURATION',message:'The AI provider rejected this application’s credentials or permissions. The site owner must check the API key and project access.',retryAfter:undefined};
 if(status===400||status===404)return {status:503,code:'AI_MODEL_CONFIGURATION',message:'The AI provider rejected the model or request configuration. The site owner must check the configured model and API access.',retryAfter:undefined};
 return {status:502,code:'AI_PROVIDER_UNAVAILABLE',message:'The AI provider could not complete this request. Try again later. This failure does not use your daily allowance.',retryAfter:undefined};
}
