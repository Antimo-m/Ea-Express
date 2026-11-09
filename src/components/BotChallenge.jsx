import { useEffect, useRef, useState } from 'react';

let loading;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => { script.remove(); loading = null; reject(new Error('Verifica non disponibile. Riprova tra poco.')); };
      document.head.append(script);
    });
  }
  return loading;
}

export default function BotChallenge({ challenge, onToken }) {
  const container = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let widget;
    loadTurnstile().then(turnstile => {
      if (!active) return;
      widget = turnstile.render(container.current, {
        sitekey: challenge.site_key,
        action: challenge.action,
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => { onToken(''); setError('Verifica non disponibile. Riprova tra poco.'); },
      });
    }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; if (widget !== undefined) window.turnstile?.remove(widget); };
  }, [challenge, onToken]);
  return <div><div ref={container} />{error && <p role="alert">{error}</p>}</div>;
}
