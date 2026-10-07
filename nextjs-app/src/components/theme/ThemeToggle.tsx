'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Theme, useTheme } from './ThemeProvider';

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active: Theme = mounted ? theme : 'black';

  return (
    <div
      className={`theme-switch ${compact ? 'theme-switch--compact' : ''}`}
      role="group"
      aria-label="Appearance"
    >
      <button
        type="button"
        aria-pressed={active === 'black'}
        aria-label="Black mode"
        title="Black mode"
        onClick={() => setTheme('black')}
      >
        <Moon className="theme-switch-icon" strokeWidth={2.25} aria-hidden />
        {!compact && <span>Black</span>}
      </button>
      <button
        type="button"
        aria-pressed={active === 'white'}
        aria-label="White mode"
        title="White mode"
        onClick={() => setTheme('white')}
      >
        <Sun className="theme-switch-icon" strokeWidth={2.25} aria-hidden />
        {!compact && <span>White</span>}
      </button>
    </div>
  );
}
