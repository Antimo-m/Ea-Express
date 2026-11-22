/**
 * Destinazione del pulsante «Torna indietro»: la pagina principale della sezione, con i filtri che l'utente aveva
 * scelto. Si accetta soltanto la stessa pagina principale (con eventuale query), mai un dettaglio o un altro sito.
 */
export function sectionReturn(location, home) {
  const from = location?.state?.from;
  return typeof from === "string" && (from === home || from.startsWith(`${home}?`)) ? from : home;
}

/** Stato da passare ai collegamenti verso un dettaglio, così il ritorno conserva filtri e pagina. */
export const returnState = location => ({ from: `${location.pathname}${location.search}` });
