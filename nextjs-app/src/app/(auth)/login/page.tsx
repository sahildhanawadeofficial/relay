'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh page-grid flex flex-col">
      <AppHeader>
        <ThemeToggle compact />
      </AppHeader>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-8">
            <p className="section-label mb-3">Sign in</p>
            <h1 className="page-heading text-3xl font-bold text-ink mb-2">Welcome back</h1>
            <p className="text-mute text-sm">Continue with Google to open your dashboard.</p>
          </div>

          <div className="glass-card-solid p-8 md:p-9">
            {error && (
              <div className="alert-error mb-6 animate-fade-in">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-line bg-fill hover:bg-fill text-ink font-medium transition-all duration-200 hover:border-edge hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Redirecting to Google...' : 'Sign in with Google'}</span>
            </button>

            <p className="text-center text-xs text-faint mt-6 leading-relaxed">
              By signing in, you agree to our <span className="text-mute">Terms of Service</span> and{' '}
              <span className="text-mute">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
