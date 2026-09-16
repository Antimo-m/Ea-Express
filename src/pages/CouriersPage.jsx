import { Link } from "react-router";
import { couriers } from "../api/workspace";
import { useApi } from "../hooks/useApi";
import { Header, State, Empty, Icon } from "../components/UI";
import { initials } from "../utils/format";
export default function CouriersPage() {
  const resource = useApi(couriers, {}, true);
  return (
    <>
      <Header
        title="Le persone che fanno strada."
        description="I corrieri assegnati alle tue spedizioni. Per contattarli, apri la conversazione della richiesta."
      />
      <State resource={resource}>
        {(data) =>
          data.data.length ? (
            <div className="courier-grid">
              {data.data.map((courier) => (
                <article className="panel courier-card" key={courier.id}>
                  <span className="avatar large">{initials(courier.name)}</span>
                  <span className="eyebrow">IL TUO CORRIERE</span>
                  <h2>{courier.name}</h2>
                  <p className="muted">
                    Assegnato a una o più delle tue spedizioni.
                  </p>
                  <Link
                    className="button secondary"
                    to={`/messages?courier=${courier.id}`}
                  >
                    <Icon name="chat-dots" />
                    Scegli una spedizione
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <section className="panel">
              <Empty
                title="Il tuo prossimo incontro è in arrivo"
                text="Quando un rider prenderà in carico la tua richiesta, lo troverai qui."
                icon="bicycle"
              >
                <Link to="/shipments/new" className="button create-button" aria-label="Nuova spedizione" title="Nuova spedizione"><span aria-hidden="true">+</span></Link>
              </Empty>
            </section>
          )
        }
      </State>
    </>
  );
}
