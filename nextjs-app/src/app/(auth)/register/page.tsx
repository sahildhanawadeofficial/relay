'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Registration is no longer needed — Google OAuth automatically creates
 * a user account on first sign-in. Redirect to /login.
 */
export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up text-center">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg glow-brand">
              R
            </div>
            <span className="font-bold text-xl text-white">Relay</span>
          </Link>
          <p className="text-slate-400 text-sm">Redirecting to sign in...</p>
        </div>
      </div>
    </div>
  );
}
