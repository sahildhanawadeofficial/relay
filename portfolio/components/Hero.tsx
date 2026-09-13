export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs text-indigo-200">
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          Full-stack developer · DevOps · Cloud infrastructure
        </div>

        <h1 className="mt-8 max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
          Hi, I&apos;m{' '}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
            Sahil Dhondiram Dhanavade
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          Self-taught developer with 4.5+ years of experience building production web apps,
          e-commerce platforms, and scalable cloud-native systems. Creator of{' '}
          <strong className="text-slate-200">StoreChoose.com</strong> — and this portfolio
          includes a live Relay AI chatbot in the corner.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#projects"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </section>
  );
}
