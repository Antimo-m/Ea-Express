import { useEffect, useState } from 'react';
import { Icon } from './UI';
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('ea:theme') || 'dark'; } catch { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.dataset.eaTheme = theme;
    try { localStorage.setItem('ea:theme', theme); } catch { /* Preferenza locale alla pagina. */ }
  }, [theme]);
  return <button className="icon-button theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-pressed={theme === 'light'} aria-label={theme === 'dark' ? 'Attiva tema chiaro' : 'Attiva tema scuro'}><Icon name={theme === 'dark' ? 'sun' : 'moon'}/></button>;
}
