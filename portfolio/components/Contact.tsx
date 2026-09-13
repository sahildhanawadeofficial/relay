export default function Contact() {
  return (
    <section id="contact" className="px-6 py-20">
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 p-8 md:p-12">
        <h2 className="text-3xl font-bold text-white">Let&apos;s work together</h2>
        <p className="mt-4 max-w-2xl text-slate-400">
          Open to freelance projects, full-stack roles, and cloud/DevOps consulting. Reach out
          directly — or ask the Relay chatbot in the corner about my work.
        </p>

        <div className="mt-6 space-y-2 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Email:</span>{' '}
            <a href="mailto:sahildhanavade769@gmail.com" className="hover:text-white">
              sahildhanavade769@gmail.com
            </a>
          </p>
          <p>
            <span className="text-slate-500">Phone:</span>{' '}
            <a href="tel:+918550952188" className="hover:text-white">(+91) 8550952188</a>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="mailto:sahildhanavade769@gmail.com"
            className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Email Me
          </a>
          <a
            href="https://www.linkedin.com/in/sahildhanavade"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            LinkedIn
          </a>
          <a
            href="https://www.youtube.com/@sahildhanawade"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            YouTube
          </a>
        </div>
      </div>
    </section>
  );
}
