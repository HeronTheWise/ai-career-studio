import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
const connection = process.env.DATABASE_URL;
if (!connection) { console.error('DATABASE_URL is required for backend migration.'); process.exit(1); }
try {
 const sql = neon(connection);
 const source = await readFile(new URL('../db/001_backend.sql', import.meta.url), 'utf8');
 const statements = source.split(';').map(s=>s.trim()).filter(Boolean);
 await sql.transaction(statements.map(s=>sql.query(s)));
 console.log('Backend migration complete: profiles, documents, generation usage.');
} catch { console.error('Backend migration failed; check database connectivity and permissions.'); process.exit(1); }
