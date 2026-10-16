import { SignIn } from '@clerk/nextjs';
export const dynamic='force-dynamic';
export default function Page(){return <main className="shell" style={{display:'grid',placeItems:'center',minHeight:'85vh'}}><SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/builder" /></main>;}
