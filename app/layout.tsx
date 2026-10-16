import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'AI Career Studio — Your next chapter, better written', description: 'Create thoughtful resumes, tailored cover letters and career documents with AI assistance.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">{children}</ClerkProvider> : children}</body></html>; }
