import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Relay — AI Chatbot Platform',
  description: 'Relay — build custom AI chatbots powered by your own documents. Multi-tenant RAG platform with OpenRouter and Pinecone.',
  keywords: ['AI', 'chatbot', 'RAG', 'OpenAI', 'document Q&A'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="black" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script id="relay-theme" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('relay-theme');if(t!=='white'&&t!=='black')t='black';document.documentElement.dataset.theme=t;}catch(e){}})();`}
        </Script>
      </head>
      <body className="antialiased min-h-screen bg-mesh" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
