import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import RelayChatWidget from '@/components/RelayChatWidget';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sahil Dhondiram Dhanavade — Full-Stack & Cloud Developer',
  description:
    'Portfolio of Sahil Dhondiram Dhanavade — full-stack developer, DevOps engineer, and creator of StoreChoose.com. Next.js, Kubernetes, AWS, and AI integrations.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#07070f] text-slate-200">
        {children}
        <RelayChatWidget />
      </body>
    </html>
  );
}
