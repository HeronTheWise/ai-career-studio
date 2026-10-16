'use client';
import { useEffect, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

async function request(path:string,method='GET',data?:unknown){
 const response=await fetch(path,{method,headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined,cache:'no-store'});
 const value=await response.json();if(!response.ok)throw new Error(value.error||'Cloud request failed.');return value;
}
function Account(){const {isLoaded,isSignedIn}=useUser();return <div className="cloud-account">{!isLoaded?'Loading account…':isSignedIn?<><span>Signed in · Cloud workspace</span><UserButton/></>:<><Link href="/sign-in" className="pill">Sign in</Link><Link href="/sign-up" className="primary">Create account</Link></>}</div>;}
export function AccountControls(){return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?<Account/>:null;}

type BuilderProps={draft:Record<string,unknown>;profile:unknown;onLoad:(draft:Record<string,unknown>)=>void;onProfile:(profile:Record<string,unknown>)=>void};
function BuilderCloud(props:BuilderProps){
 const {isLoaded,isSignedIn}=useUser();const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const [error,setError]=useState('');
 useEffect(()=>{if(!isLoaded||!isSignedIn)return;const id=new URLSearchParams(window.location.search).get('cloud');if(!id)return;
 let active=true;setBusy(true);request('/api/documents/'+encodeURIComponent(id)).then(d=>{if(active){props.onLoad(d.document.draft);setNotice('Cloud version opened. Changes are drafts on this browser until you save another cloud version.');}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};
 // Load only when the account changes; edits must not re-fetch and overwrite the form.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[isLoaded,isSignedIn]);
 async function act(action:()=>Promise<void>){setBusy(true);setNotice('');setError('');try{await action();}catch(e){setError(e instanceof Error?e.message:'Cloud request failed.');}finally{setBusy(false);}}
 if(!isLoaded)return null;
 if(!isSignedIn)return <section className="cloud-panel"><h3>Keep your work across devices</h3><p>Sign in to save your profile and document versions online. Your existing browser drafts stay available.</p><Link className="pill" href="/sign-in">Sign in to cloud workspace →</Link></section>;
 return <section className="cloud-panel"><h3>Your cloud workspace</h3><p>Cloud saves belong to your signed-in account. Local drafts remain on this browser.</p><div className="export-actions">
 <button className="primary" disabled={busy||!String(props.draft.content||'').trim()} onClick={()=>act(async()=>{await request('/api/documents','POST',{title:`${props.draft.fullName||'Untitled'} — ${String(props.draft.docType).replaceAll('_',' ')}`.slice(0,160),draft:props.draft});setNotice('New version saved to your cloud workspace.');})}>{busy?'Working…':'Save cloud version'}</button>
 <button className="pill" disabled={busy} onClick={()=>act(async()=>{await request('/api/profile','PUT',props.profile);setNotice('Profile saved to your account.');})}>Save profile</button>
 <button className="pill" disabled={busy} onClick={()=>act(async()=>{if(!confirm('Replace the profile fields in this draft with your cloud profile?'))return;const d=await request('/api/profile');if(!d.profile)throw new Error('No cloud profile saved yet.');props.onProfile(d.profile);setNotice('Profile loaded. Your document text was kept.');})}>Load profile</button>
 </div>{notice&&<p role="status">{notice}</p>}{error&&<p className="error-box" role="alert">{error}</p>}</section>;
}
export function CloudBuilder(props:BuilderProps){return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?<BuilderCloud {...props}/>:null;}

type CloudDocument={id:string;title:string;template:string;excerpt:string;created_at:string};
function Documents(){const {isLoaded,isSignedIn,user}=useUser();const [rows,setRows]=useState<CloudDocument[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;setRows([]);setError('');if(!isLoaded||!isSignedIn){setLoading(false);return;}setLoading(true);request('/api/documents').then(d=>{if(active)setRows(d.documents);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[isLoaded,isSignedIn,user?.id]);
 async function remove(id:string){if(!confirm('Permanently delete this cloud version?'))return;setBusy(true);setError('');try{await request('/api/documents/'+id,'DELETE');setRows(v=>v.filter(d=>d.id!==id));}catch(e){setError(e instanceof Error?e.message:'Delete failed.');}finally{setBusy(false);}}
 if(!isLoaded)return null;
 if(!isSignedIn)return <section className="cloud-panel"><h2>Your cloud documents</h2><p>Sign in to access saved documents from any device.</p><Link className="pill" href="/sign-in">Sign in →</Link></section>;
 return <section className="cloud-panel"><h2>Your cloud documents</h2><p>Latest 100 saved versions · Private to your account</p>{loading&&<p role="status">Loading documents…</p>}{error&&<p role="alert" className="error-box">{error}</p>}{!loading&&!error&&!rows.length&&<p>No cloud versions yet. Open the builder and choose “Save cloud version”.</p>}<div className="feature-grid">{rows.map(d=><article className="feature" key={d.id}><span className="tag">Cloud · {d.template}</span><h3>{d.title}</h3><p>{new Date(d.created_at).toLocaleDateString()}</p><p className="version-excerpt">{d.excerpt}…</p><div className="export-actions"><Link className="primary" href={'/builder?cloud='+d.id}>Open & edit</Link><button className="text-button" disabled={busy} onClick={()=>remove(d.id)}>Delete</button></div></article>)}</div><button className="text-button" disabled={busy} onClick={async()=>{if(!confirm('Delete your cloud profile? Saved documents are kept.'))return;setBusy(true);setError('');try{await request('/api/profile','DELETE');window.alert('Cloud profile deleted.');}catch(e){setError(e instanceof Error?e.message:'Delete failed.');}finally{setBusy(false);}}}>Delete cloud profile</button></section>;
}
export function CloudDocuments(){return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?<Documents/>:null;}
