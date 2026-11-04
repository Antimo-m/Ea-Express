export default function Brand({ caption }) {
  return <span className="brand-lockup">
    <span className="brand-wordmark" role="img" aria-label="EA-Express"><b>EA</b><span>-Express</span></span>
    {caption && <small className="brand-caption">{caption}</small>}
  </span>;
}
