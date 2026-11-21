import { useLayoutEffect, useRef } from "react";
import { Icon } from "./UI";
import Truck from "./Truck";
import { date } from "../utils/format";

// Percorso animato della spedizione. La posizione arriva sempre dal backend (stato registrato):
// qui si anima soltanto il passaggio dalla tappa precedente a quella nuova quando i dati si aggiornano.
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const confettiColors = ["#e6a23d", "#3fbf8f", "#f5f2ec", "#ffcc7a", "#6fa8dc"];
const celebratedKey = "ea:delivered-celebrated";

// Una sola festa per spedizione e per dispositivo: le visite successive mostrano solo la scritta "Consegnato!".
const celebratedIds = () => { try { return JSON.parse(localStorage.getItem(celebratedKey) || "[]"); } catch { return []; } };
const alreadyCelebrated = (id) => Boolean(id) && celebratedIds().includes(id);
function markCelebrated(id) {
  if (!id) return;
  try { localStorage.setItem(celebratedKey, JSON.stringify([...celebratedIds().filter((seen) => seen !== id), id].slice(-200))); }
  catch { /* Senza memoria locale la festa si ripete alla prossima apertura: nessun dato viene perso. */ }
}

function celebrate(root, id) {
  const burst = root.querySelector(".trip-confetti");
  if (!burst || reducedMotion()) return () => {};
  root.classList.add("is-celebrating");
  burst.replaceChildren(...Array.from({ length: 22 }, (_, index) => {
    const piece = document.createElement("span");
    const angle = -Math.PI + (index / 21) * Math.PI * 0.85;
    const reach = 46 + ((index * 37) % 5) * 12;
    piece.style.setProperty("--dx", `${Math.round(Math.cos(angle) * reach)}px`);
    piece.style.setProperty("--dy", `${Math.round(Math.sin(angle) * reach * 0.9) - 10}px`);
    piece.style.setProperty("--spin", `${((index * 53) % 360) + 180}deg`);
    piece.style.setProperty("--delay", `${(index % 4) * 40}ms`);
    piece.style.background = confettiColors[index % confettiColors.length];
    return piece;
  }));
  const timer = window.setTimeout(() => { burst.replaceChildren(); root.classList.remove("is-celebrating"); markCelebrated(id); }, 1900);
  return () => { window.clearTimeout(timer); burst.replaceChildren(); root.classList.remove("is-celebrating"); };
}

function drive(root, previous, target, onArrive) {
  const duration = Math.min(2.6, 1 + Math.abs(target - previous) * 0.35);
  const stops = [...root.querySelectorAll(".trip-stop")];
  const forward = target > previous;
  const timers = [];
  let frame = 0;
  let finished = false;
  let cleanupArrival;

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
    cleanupArrival = onArrive?.();
  };
  const onEnd = (event) => { if (event.propertyName === "translate") finish(); };
  vehicle?.addEventListener("transitionend", onEnd);
  timers.push(window.setTimeout(finish, duration * 1000 + 250));

  return () => {
    cleanupArrival?.();
    cancelAnimationFrame(frame);
    timers.forEach((timer) => window.clearTimeout(timer));
    vehicle?.removeEventListener("transitionend", onEnd);
    root.classList.remove("is-preparing", "is-driving", "has-arrived");
    root.style.setProperty("--trip-at", String(target));
    stops.forEach((stop) => { stop.classList.remove("is-pending"); stop.style.transitionDelay = ""; });
  };
}

export default function ShipmentJourney({ progress, from, to, celebrationId }) {
  const root = useRef(null);
  const position = progress?.position;
  const arrived = progress?.state === "arrived";
  const previous = useRef(position);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = position;
    if (!root.current || before == null || position == null || before === position || reducedMotion() || document.hidden) return undefined;
    return drive(root.current, before, position, () => (arrived && !alreadyCelebrated(celebrationId) ? celebrate(root.current, celebrationId) : undefined));
  }, [position, arrived, celebrationId]);

  // Prima apertura di una spedizione già consegnata: festa una volta sola, senza ripeterla a ogni aggiornamento.
  useLayoutEffect(() => {
    if (!arrived || !root.current || document.hidden || reducedMotion()) return undefined;
    if (root.current.classList.contains("is-driving")) return undefined;
    return alreadyCelebrated(celebrationId) ? undefined : celebrate(root.current, celebrationId);
  }, [arrived, celebrationId]);

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
          {steps.map((step, index) => (
            <span key={step.status} className={`trip-stop is-${step.state}${index === steps.length - 1 ? " is-destination" : ""}`} style={{ "--stop": index }}>
              {index === steps.length - 1 && <Icon name="flag-fill" />}
            </span>
          ))}
          {state === "arrived" && <span className="trip-arrived">Consegnato!</span>}
          <span className="trip-confetti" />
          <span className="trip-vehicle">
            {exception && <span className={`trip-signal${stopped ? " is-stopped" : ""}`}><Icon name={stopped ? "x-lg" : "exclamation-lg"} /></span>}
            <Truck />
          </span>
        </div>
        {(from || to) && (
          <div className="trip-places">
            {from && <span className="trip-place trip-place--from"><Icon name="circle-fill" /><span>{from}</span></span>}
            {to && <span className="trip-place trip-place--to"><span>{to}</span><Icon name="geo-alt-fill" /></span>}
          </div>
        )}
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
