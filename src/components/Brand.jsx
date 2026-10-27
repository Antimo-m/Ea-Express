export default function Brand({ caption }) {
  return <span className="brand-wordmark" role="img" aria-label="EA-EXPRESS">
    <b>EA</b><span>-EXPRESS{caption && <small>{caption}</small>}</span>
  </span>;
}
