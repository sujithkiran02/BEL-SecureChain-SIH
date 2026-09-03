'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center opacity-0 transition-opacity duration-300" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 rounded-full glass-panel-hover flex items-center justify-center transition-all duration-300"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 text-accent rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 text-primary rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
