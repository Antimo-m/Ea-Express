import { useLayoutEffect, useRef } from "react";
import { Icon } from "./UI";
import { date } from "../utils/format";

// Percorso animato della spedizione. La posizione arriva sempre dal backend (stato registrato):
// qui si anima soltanto il passaggio dalla tappa precedente a quella nuova quando i dati si aggiornano.
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function drive(root, previous, target) {
  const duration = Math.min(2.6, 1 + Math.abs(target - previous) * 0.35);
  const stops = [...root.querySelectorAll(".trip-stop")];
  const forward = target > previous;
  const timers = [];
  let frame = 0;
  let finished = false;

  root.classList.add("is-preparing");
  root.style.setProperty("--trip-at", String(previous));
  root.style.setProperty("--trip-duration", `${duration}s`);
  // Le tappe raggiunte durante il tragitto si accendono quando il camion ci passa sopra.
  stops.forEach((stop, index) => {
    stop.style.transitionDelay = "";
    if (forward && index > previous && index <= target) {
      stop.classList.add("is-pending");
      stop.style.transitionDelay = `${((index - previous) / (target - previous)) * duration * 0.92}s`;
    }
  });
  void root.offsetWidth;
  root.classList.remove("is-preparing");
  root.classList.add("is-driving");
  frame = requestAnimationFrame(() => {
    root.style.setProperty("--trip-at", String(target));
    stops.forEach((stop) => stop.classList.remove("is-pending"));
  });

  const vehicle = root.querySelector(".trip-vehicle");
  const finish = () => {
    if (finished) return;
    finished = true;
    root.classList.remove("is-driving");
    stops.forEach((stop) => { stop.style.transitionDelay = ""; });
    root.classList.add("has-arrived");
    timers.push(window.setTimeout(() => root.classList.remove("has-arrived"), 1000));
  };
  const onEnd = (event) => { if (event.propertyName === "translate") finish(); };
  vehicle?.addEventListener("transitionend", onEnd);
  timers.push(window.setTimeout(finish, duration * 1000 + 250));

  return () => {
    cancelAnimationFrame(frame);
    timers.forEach((timer) => window.clearTimeout(timer));
    vehicle?.removeEventListener("transitionend", onEnd);
    root.classList.remove("is-preparing", "is-driving", "has-arrived");
    root.style.setProperty("--trip-at", String(target));
    stops.forEach((stop) => { stop.classList.remove("is-pending"); stop.style.transitionDelay = ""; });
  };
}

function Truck() {
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

export default function ShipmentJourney({ progress, from, to }) {
  const root = useRef(null);
  const position = progress?.position;
  const previous = useRef(position);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = position;
    if (!root.current || before == null || position == null || before === position || reducedMotion() || document.hidden) return undefined;
    return drive(root.current, before, position);
  }, [position]);

  if (!progress?.steps?.length) return null;
  const { steps, exception, state } = progress;
  const stopped = state === "stopped";
  const headline = exception?.label ?? steps[position]?.label;
  const nowLabel = exception ? "Spedizione interrotta" : state === "arrived" ? "Spedizione completata" : "Fase attuale";

  return (
    <section ref={root} className="panel trip" aria-labelledby="trip-heading" data-trip-state={state} style={{ "--trip-stops": steps.length, "--trip-at": position }}>
      <div className="trip-heading">
        <div><span className="eyebrow">AVANZAMENTO</span><h2 id="trip-heading">Il percorso della spedizione</h2></div>
        <p className="trip-now" aria-live="polite"><span className="trip-now-label">{nowLabel}</span><strong>{headline}</strong><span className="trip-now-count">Tappa {position + 1} di {steps.length}</span></p>
      </div>
      <div className="trip-scene" aria-hidden="true">
        <div className="trip-road">
          <span className="trip-road-fill" />
          {from && <span className="trip-place trip-place--from"><Icon name="circle-fill" /> {from}</span>}
          {to && <span className="trip-place trip-place--to">{to} <Icon name="geo-alt-fill" /></span>}
          {steps.map((step, index) => (
            <span key={step.status} className={`trip-stop is-${step.state}${index === steps.length - 1 ? " is-destination" : ""}`} style={{ "--stop": index }}>
              {index === steps.length - 1 && <Icon name="flag-fill" />}
            </span>
          ))}
          <span className="trip-vehicle">
            {exception && <span className={`trip-signal${stopped ? " is-stopped" : ""}`}><Icon name={stopped ? "x-lg" : "exclamation-lg"} /></span>}
            <Truck />
          </span>
        </div>
      </div>
      {exception && (
        <div className={`trip-exception${stopped ? " is-stopped" : ""}`} role="status">
          <strong>{exception.label}</strong>
          {exception.at && <time dateTime={exception.at}>{date(exception.at, true)}</time>}
          <p>{exception.note || "Ti avviseremo appena ci sono novità sulla spedizione."}</p>
          {exception.last && <small>Ultimo passaggio registrato: {exception.last}</small>}
        </div>
      )}
      <ol className="trip-stages">
        {steps.map((step) => (
          <li key={step.status} className={`trip-stage is-${step.state}`} aria-current={step.state === "current" ? "step" : undefined}>
            <span className="trip-stage-dot" aria-hidden="true">{step.state === "complete" ? <Icon name="check-lg" /> : null}</span>
            <div>
              <strong>{step.label}</strong>
              <span>{step.at ? <time dateTime={step.at}>{date(step.at, true)}</time> : step.optional ? "Se previsto" : "In attesa"}</span>
              {step.note && <small>{step.note}</small>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
