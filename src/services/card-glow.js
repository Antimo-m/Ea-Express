/**
 * Riflesso delle card del portale: con mouse o trackpad la luce segue il cursore sulla card.
 * Un solo ascoltatore e un aggiornamento per fotogramma; nessun effetto su touch o con «riduci movimento».
 */
const cards = '.shipment-card, .metric-tile, .pickup-card, .notification-group, .order-focus-summary, .pending-account-panel, .rate-card, .dashboard-actions, .month-recap, .label-pick, .request-details, .price-panel';
const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let frame = 0, pending;

document.addEventListener('pointermove', event => {
  if (!fine.matches || reduced.matches) return;
  pending = event;
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const card = pending.target instanceof Element ? pending.target.closest(cards) : null;
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--glow-x', `${pending.clientX - box.left}px`);
    card.style.setProperty('--glow-y', `${pending.clientY - box.top}px`);
  });
}, { passive: true });
