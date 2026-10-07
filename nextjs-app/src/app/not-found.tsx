import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-mesh page-grid flex flex-col">
      <AppHeader>
        <ThemeToggle compact />
      </AppHeader>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="section-label mb-3">404</p>
        <h1 className="page-heading text-3xl md:text-4xl font-bold text-ink mb-3">Page not found</h1>
        <p className="text-mute max-w-md mb-8">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Link href="/" className="btn-brand">
          Back to home
        </Link>
      </div>
    </main>
  );
}
