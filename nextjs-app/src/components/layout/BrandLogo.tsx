import Link from 'next/link';

type BrandLogoProps = {
  size?: 'sm' | 'md';
};

export function BrandLogo({ size = 'md' }: BrandLogoProps) {
  const box = size === 'sm' ? 'w-8 h-8 rounded-lg text-sm' : 'w-9 h-9 rounded-xl text-base';
  const label = size === 'sm' ? 'text-lg' : 'text-xl';

  return (
    <Link href="/" className="brand-logo group">
      <span
        className={`${box} brand-logo-mark flex items-center justify-center text-white font-bold shadow-lg transition-transform duration-200 group-hover:scale-105`}
        aria-hidden
      >
        R
      </span>
      <span className={`font-bold ${label} text-ink tracking-tight`}>Relay</span>
    </Link>
  );
}
