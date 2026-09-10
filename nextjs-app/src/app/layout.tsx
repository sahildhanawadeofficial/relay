import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'NeuralChat — AI Chatbot Platform',
  description: 'Build custom AI chatbots powered by your own documents. Multi-tenant RAG platform with OpenAI and Pinecone.',
  keywords: ['AI', 'chatbot', 'RAG', 'OpenAI', 'document Q&A'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen bg-mesh">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
