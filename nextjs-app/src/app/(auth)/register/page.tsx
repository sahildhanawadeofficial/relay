'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
    <div className="min-h-screen bg-mesh page-grid flex flex-col">
      <AppHeader>
        <ThemeToggle compact />
      </AppHeader>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up text-center glass-card-static p-10">
          <div className="inline-flex w-12 h-12 rounded-xl brand-logo-mark items-center justify-center text-white font-bold mb-4 mx-auto">
            R
          </div>
          <p className="text-mute text-sm">Redirecting to sign in...</p>
        </div>
      </div>
    </div>
  );
}
