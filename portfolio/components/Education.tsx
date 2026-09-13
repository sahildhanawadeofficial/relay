const education = [
  {
    degree: 'MCA (Master of Computer Applications)',
    school: 'PES Modern College of Engineering, Shivaji Nagar',
    detail: 'Currently pursuing',
  },
  {
    degree: 'B.Com',
    school: 'Savitribai Phule Pune University',
    detail: '6.4 CGPA',
  },
  {
    degree: 'XII (Commerce)',
    school: 'Kendriya Vidyalaya (CBSE)',
    detail: '78.4%',
  },
  {
    degree: 'X',
    school: 'Kendriya Vidyalaya (CBSE)',
    detail: '78.4%',
  },
];

export default function Education() {
  return (
    <section id="education" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-white">Education</h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          Academic background alongside hands-on, self-directed engineering experience.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {education.map((item) => (
            <div
              key={item.degree}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h3 className="font-semibold text-white">{item.degree}</h3>
              <p className="mt-2 text-sm text-slate-400">{item.school}</p>
              <p className="mt-3 inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
