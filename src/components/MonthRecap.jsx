import { Link } from "react-router";
import { Icon } from "./UI";

const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
const monthName = (month, style = "long") => new Intl.DateTimeFormat("it-IT", { month: style, timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/**
 * Riepilogo del mese in corso: richieste create nel mese e quante sono già consegnate (stessi conteggi della
 * pagina Statistiche), il volume degli ultimi sei mesi e il prossimo traguardo di spedizioni.
 */
export default function MonthRecap({ recap }) {
  if (!recap?.months?.some(month => month.shipments > 0)) return null;
  const name = monthName(recap.month);
  const target = milestones.find(value => value > recap.shipments);
  const previous = [...milestones].reverse().find(value => value <= recap.shipments) || 0;
  const progress = target ? Math.round(((recap.shipments - previous) / (target - previous)) * 100) : 100;
  const highest = Math.max(1, ...recap.months.map(month => month.shipments));
  return (
    <section className="month-recap" aria-labelledby="month-recap-title">
      <div className="month-recap-summary">
        <span className="eyebrow">IL TUO {name.toUpperCase()}</span>
        <h2 id="month-recap-title">{recap.shipments ? <>A {name} hai richiesto <strong>{plural(recap.shipments, "spedizione", "spedizioni")}</strong></> : <>A {name} non hai ancora richiesto spedizioni</>}</h2>
        {recap.shipments > 0 && <p><Icon name="check2-circle" /> {plural(recap.delivered, "già consegnata", "già consegnate")}</p>}
        <div className="month-milestone">
          <div className="month-milestone-label"><Icon name={target ? "flag" : "trophy"} /><span>{target ? <>Prossimo traguardo: <b>{target}</b> · {recap.shipments ? `ne ${target - recap.shipments === 1 ? "manca" : "mancano"} ${target - recap.shipments}` : "inizia dalla prima"}</> : "Traguardo massimo raggiunto: complimenti!"}</span></div>
          <div className="month-milestone-bar" role="progressbar" aria-label="Avanzamento verso il prossimo traguardo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ "--progress": `${progress}%` }} /></div>
        </div>
      </div>
      <figure className="month-recap-chart">
        <figcaption>Spedizioni richieste negli ultimi sei mesi</figcaption>
        <ol>
          {recap.months.map(month => (
            <li key={month.month} className={month.month === recap.month ? "is-current" : undefined}>
              <span className="month-bar" style={{ "--height": `${Math.max(4, Math.round((month.shipments / highest) * 100))}%` }}><b>{month.shipments}</b></span>
              <small aria-label={`${monthName(month.month)}: ${plural(month.shipments, "spedizione", "spedizioni")}`}>{monthName(month.month, "short")}</small>
            </li>
          ))}
        </ol>
        <Link className="month-recap-link" to="/statistics">Tutte le statistiche <Icon name="arrow-right" /></Link>
      </figure>
    </section>
  );
}
