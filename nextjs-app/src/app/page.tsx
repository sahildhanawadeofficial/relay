import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const features = [
  {
    icon: '📄',
    title: 'Upload Documents',
    desc: 'PDF, DOCX, and TXT. Your knowledge base, your rules.',
  },
  {
    icon: '🧠',
    title: 'Semantic Search',
    desc: 'Embeddings find the most relevant context instantly.',
  },
  {
    icon: '🔒',
    title: 'Tenant Isolation',
    desc: 'Each chatbot keeps its own private Pinecone namespace.',
  },
];

const steps = [
  { n: '01', title: 'Create a bot', desc: 'Name your assistant and get a unique ID in seconds.' },
  { n: '02', title: 'Upload docs', desc: 'Train on PDFs, Word files, or plain text.' },
  { n: '03', title: 'Embed anywhere', desc: 'Drop the widget on your site or call the API.' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-mesh bg-mesh-animated page-grid flex flex-col">
      <AppHeader>
        <ThemeToggle compact />
        <Link href="/login" className="btn-ghost text-sm py-2 px-4 hidden sm:inline-flex">
          Sign In
        </Link>
        <Link href="/register" className="btn-brand text-sm py-2 px-4">
          Get Started
        </Link>
      </AppHeader>

      <section className="relative flex-1 flex flex-col items-center text-center px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="hero-glow" aria-hidden />

        <div className="relative z-10 max-w-4xl animate-fade-in-up">
          <div className="inline-flex items-center gap-2 badge badge-brand mb-8 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            RAG · OpenRouter · Pinecone
          </div>

          <h1 className="page-heading text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05] text-ink">
            Build{' '}
            <span className="gradient-text">Intelligent</span>
            <br />
            Document Chatbots
          </h1>

          <p className="text-lg md:text-xl text-mute max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your documents and ship AI assistants that answer with citations — grounded in your
            private knowledge base, not the open web.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/register" className="btn-brand px-8 py-3.5 text-base rounded-xl">
              Start for Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/login" className="btn-ghost px-8 py-3.5 text-base rounded-xl">
              Sign In
            </Link>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl w-full stagger mb-20">
          {features.map((f) => (
            <div key={f.title} className="glass-card feature-tile p-6 text-left animate-fade-in-up">
              <span className="icon-ring">{f.icon}</span>
              <h3 className="font-semibold text-ink mb-1.5">{f.title}</h3>
              <p className="text-sm text-mute leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10 w-full max-w-5xl text-left">
          <p className="section-label mb-4 text-center">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
            {steps.map((step) => (
              <div key={step.n} className="glass-card-static p-5 animate-fade-in-up">
                <p className="text-xs font-mono text-brand mb-2">{step.n}</p>
                <h3 className="font-semibold text-ink mb-1">{step.title}</h3>
                <p className="text-sm text-mute leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-faint text-sm border-t border-line">
        <p>© {new Date().getFullYear()} Relay — multi-tenant AI chatbot platform.</p>
      </footer>
    </main>
  );
}
