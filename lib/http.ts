export async function readJson(request: Request, maxBytes = 160000): Promise<unknown> {
 if (Number(request.headers.get('content-length')) > maxBytes) throw new Error('BODY_TOO_LARGE');
 if (!request.body) return null;
 const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
 try { while (true) { const {done, value} = await reader.read(); if(done) break; total += value.length;
 if (total > maxBytes) { await reader.cancel(); throw new Error('BODY_TOO_LARGE'); } chunks.push(value); }
 return JSON.parse(Buffer.concat(chunks).toString('utf8')); } finally { reader.releaseLock(); }
}
