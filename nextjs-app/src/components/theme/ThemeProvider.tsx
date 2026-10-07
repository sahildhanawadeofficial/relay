'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'black' | 'white';

const STORAGE_KEY = 'relay-theme';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'black',
  setTheme: () => {},
});

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'black';
  return document.documentElement.dataset.theme === 'white' ? 'white' : 'black';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('black');

  useEffect(() => {
    setThemeState(readTheme());
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable in private browsing.
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
