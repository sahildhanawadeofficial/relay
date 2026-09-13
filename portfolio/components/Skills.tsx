const skillGroups = [
  {
    title: 'Frontend & Backend',
    skills: ['HTML', 'CSS', 'JavaScript', 'React.js', 'Next.js', 'Node.js', 'PHP', 'Python'],
  },
  {
    title: 'Databases',
    skills: ['MongoDB', 'MySQL'],
  },
  {
    title: 'DevOps & Cloud',
    skills: [
      'Docker',
      'Kubernetes',
      'CI/CD',
      'ArgoCD',
      'Grafana',
      'NGINX',
      'Shell Script',
      'Git / GitHub',
    ],
  },
  {
    title: 'AWS',
    skills: [
      'S3',
      'CloudFront',
      'Global Accelerator',
      'NLB / ALB',
      'Target Groups',
      'Route 53',
      'Amplify',
    ],
  },
  {
    title: 'Google Cloud',
    skills: ['GKE (Kubernetes clusters)'],
  },
];

export default function Skills() {
  return (
    <section id="skills" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-white">Skills</h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          Technologies I use to build, deploy, and scale production applications.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">
                {group.title}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
