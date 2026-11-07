import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const home = user ? '/dashboard' : '/login';
  const [remaining, setRemaining] = useState(5);

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, 5 - Math.floor((Date.now() - started) / 1000)));
    }, 1000);
    const redirect = window.setTimeout(() => navigate(home, { replace: true }), 5000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(redirect);
    };
  }, [home, navigate]);

  return <section className="not-found-page" aria-labelledby="not-found-title">
    <span className="not-found-code" aria-hidden="true">404</span>
    <h1 id="not-found-title">Error Not Found 404</h1>
    <p>Ci dispiace ma non è stato possibile trovare ciò che cercavi, verrai reindirizzato in home</p>
    <p role="status" aria-live="polite">Reindirizzamento tra {remaining} {remaining === 1 ? 'secondo' : 'secondi'}.</p>
    <Link className="button" to={home} replace>Vai alla home</Link>
  </section>;
}
