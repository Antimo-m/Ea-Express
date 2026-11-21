// Camion EA-Express disegnato in SVG: usato nel percorso della spedizione, negli avvisi e nella pagina vuota.
export default function Truck() {
  return (
    <svg className="trip-truck" viewBox="0 0 112 60" focusable="false">
      <ellipse className="trip-truck-shadow" cx="56" cy="55" rx="46" ry="3.6" />
      <rect className="trip-truck-box" x="4" y="6" width="66" height="36" rx="6" />
      <rect className="trip-truck-stripe" x="4" y="30" width="66" height="5" />
      <text className="trip-truck-mark" x="37" y="24" textAnchor="middle">EA</text>
      <path className="trip-truck-cab" d="M72 16h17.5a6 6 0 0 1 5.2 3l6.6 11.4a6 6 0 0 1 .8 3V42H72z" />
      <path className="trip-truck-glass" d="M77 20h11.4a3 3 0 0 1 2.6 1.5l4.4 7.5H77z" />
      <rect className="trip-truck-light" x="98" y="34" width="4" height="3.4" rx="1.2" />
      <rect className="trip-truck-chassis" x="2" y="41" width="102" height="4.5" rx="2.2" />
      {[24, 84].map((x) => (
        <g key={x} className="trip-wheel" style={{ transformOrigin: `${x}px 46px` }}>
          <circle cx={x} cy="46" r="8.5" className="trip-tyre" />
          <circle cx={x} cy="46" r="4" className="trip-rim" />
          <path d={`M${x} 39.5v13M${x - 6.5} 46h13`} className="trip-spoke" />
        </g>
      ))}
    </svg>
  );
}
