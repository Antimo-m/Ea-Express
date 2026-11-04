import { Link } from 'react-router';

export default function PrivacyLinks() {
  return <nav className="privacy-links" aria-label="Privacy e memorizzazione dati">
    <Link to="/cookies">Cookie e preferenze</Link>
    <Link to="/privacy">Privacy Policy</Link>
  </nav>;
}
