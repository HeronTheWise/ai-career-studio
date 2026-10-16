import { SignUp } from '@clerk/nextjs';
export const dynamic='force-dynamic';
export default function Page(){return <main className="shell" style={{display:'grid',placeItems:'center',minHeight:'85vh'}}><SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/builder" /></main>;}
