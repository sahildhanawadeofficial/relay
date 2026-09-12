import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-mesh flex flex-col">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            R
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Relay</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm py-2 px-4">
            Sign In
          </Link>
          <Link href="/register" className="btn-brand text-sm py-2 px-4">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 badge badge-brand mb-8 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Powered by OpenAI &amp; Pinecone
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Build{' '}
          <span className="gradient-text">Intelligent</span>
          <br />
          Document Chatbots
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Upload your documents and create AI assistants that answer questions 
          with precision — powered by your own private knowledge base.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
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

        {/* FEATURE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full stagger">
          {[
            {
              icon: '📄',
              title: 'Upload Documents',
              desc: 'PDF, DOCX, and TXT. Your knowledge base, your rules.',
            },
            {
              icon: '🧠',
              title: 'Semantic Search',
              desc: 'OpenAI embeddings find the most relevant context instantly.',
            },
            {
              icon: '🔒',
              title: 'Multi-Tenant Isolation',
              desc: 'Each chatbot has its own private knowledge base in Pinecone.',
            },
          ].map((f) => (
            <div key={f.title} className="glass-card p-6 text-left animate-fade-in-up">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 text-center text-slate-600 text-sm border-t border-white/5">
        © {new Date().getFullYear()} Relay. Multi-tenant AI chatbot platform.
      </footer>
    </main>
  );
}
