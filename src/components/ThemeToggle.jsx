import { useEffect, useState } from 'react';
import { Icon } from './UI';
import { useAuth } from '../hooks/useAuth';
export default function ThemeToggle() {
  const { user, updateDisplayPreferences } = useAuth();
  const theme = user?.portal_preferences?.theme || 'light';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    document.documentElement.dataset.eaTheme = theme;
  }, [theme]);
  async function toggle() {
    setBusy(true); setError('');
    try { await updateDisplayPreferences({theme: theme === 'dark' ? 'light' : 'dark'}); }
    catch { setError('Tema non salvato. Riprova.'); }
    finally { setBusy(false); }
  }
  return <><button className="icon-button theme-toggle" type="button" disabled={busy} onClick={toggle} aria-pressed={theme === 'light'} aria-label={theme === 'dark' ? 'Attiva tema chiaro' : 'Attiva tema scuro'}><Icon name={theme === 'dark' ? 'sun' : 'moon'}/></button>{error && <span className="preference-error" role="alert">{error}</span>}</>;
}
