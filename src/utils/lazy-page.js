import { lazy } from "react";

const reloadKey = "ea:stale-build-reload";

/**
 * Dopo un aggiornamento del portale i file JavaScript della versione precedente non esistono più: una scheda rimasta
 * aperta non riesce a caricare la pagina richiesta. In quel caso si ricarica una sola volta la pagina corrente, così il
 * browser scarica la nuova versione; se il problema si ripete l'errore resta visibile invece di ricaricare in loop.
 */
export function reloadForNewBuild(storage = sessionStorage, reload = () => window.location.reload(), now = Date.now()) {
  let last = 0;
  try { last = Number(storage.getItem(reloadKey)) || 0; } catch { /* storage non disponibile */ }
  if (now - last < 60000) return false;
  try { storage.setItem(reloadKey, String(now)); } catch { return false; }
  reload();
  return true;
}

export function lazyPage(loader, onStaleBuild = reloadForNewBuild) {
  return lazy(() => loader().catch((error) => {
    if (onStaleBuild()) return new Promise(() => {});
    throw error;
  }));
}
