const projects = [
  {
    title: 'StoreChoose.com — E-commerce Store Builder',
    description:
      'A Shopify alternative with 0% commission and pay-as-you-go bandwidth. Multi-microservice architecture on Kubernetes with Dragonfly caching, ArgoCD GitOps, SSL automation, and AWS Global Accelerator.',
    tags: ['Next.js', 'Kubernetes', 'ArgoCD', 'AWS', 'MongoDB'],
    href: 'https://storechoose.com',
  },
  {
    title: 'The Illuminated Trader',
    description:
      'Trading course & margin strategy platform with Razorpay payments, admin panel for access control, MongoDB, S3 + CloudFront media delivery, deployed on AWS Amplify.',
    tags: ['Next.js', 'Razorpay', 'MongoDB', 'AWS'],
    href: 'https://www.theilluminatedtrader.com',
  },
  {
    title: 'UpMyStandard — E-commerce Platform',
    description:
      'Dynamic e-commerce with variant product cards, reviews, admin panel, dynamic categories/filters, and role-based user management. Hosted on Vercel.',
    tags: ['Next.js', 'MongoDB', 'Vercel'],
    href: 'https://upmystandard.vercel.app',
  },
  {
    title: '1Markers — MCQ Learning Platform',
    description:
      'MCQ-based study platform with tests, performance analytics, and NextAuth session management. Built with Next.js and MongoDB on Vercel.',
    tags: ['Next.js', 'NextAuth', 'MongoDB'],
    href: 'https://1markers.vercel.app',
  },
  {
    title: 'Relay — RAG Chatbot Platform',
    description:
      'Multi-tenant AI chatbot platform with document upload, Pinecone vector search, OpenRouter LLM answers, and an embeddable npm widget (relay-chat-widget).',
    tags: ['Next.js', 'Pinecone', 'OpenRouter', 'npm'],
    href: 'https://relayy-dun.vercel.app',
  },
  {
    title: 'SD Software',
    description: 'Business website for SD Software services.',
    tags: ['Web Development'],
    href: 'https://sdsoftware.in/',
  },
];

export default function Projects() {
  return (
    <section id="projects" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-white">Projects</h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          Production apps built solo — from e-commerce storefronts to cloud-native platforms.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <a
              key={project.title}
              href={project.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-indigo-400/30 hover:bg-white/[0.05]"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-indigo-200">
                {project.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{project.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
