export default function About() {
  return (
    <section id="about" className="px-6 py-20">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">About Me</h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            I&apos;m a full-stack developer and cloud engineer based in India. Over the past
            4.5 years I&apos;ve taught myself to build end-to-end products — from Next.js
            storefronts and admin panels to Kubernetes microservices, CI/CD pipelines, and
            multi-cloud deployments on AWS and Google Cloud.
          </p>
          <p className="mt-4 text-slate-400 leading-relaxed">
            My flagship project, <strong className="text-slate-200">StoreChoose.com</strong>, is
            a Shopify alternative with zero commission, pay-as-you-go bandwidth, and a
            microservices architecture running on Kubernetes with ArgoCD, Dragonfly caching, and
            AWS Global Accelerator.
          </p>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Outside of code, I run a YouTube channel with 12,100+ subscribers where I share
            cycling stunt videos — the same persistence and creativity I bring to engineering.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Quick facts</h3>
          <dl className="mt-5 space-y-4">
            {[
              ['Location', 'Pune, India'],
              ['Experience', '4.5+ years (self-taught)'],
              ['Focus', 'Full-stack, DevOps, Cloud'],
              ['MCA', 'Pursuing at PES Modern COE'],
              ['YouTube', '12.1K subscribers'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0"
              >
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-right text-sm font-medium text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
