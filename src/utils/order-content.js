export const contentCategories = {
  clothing: 'Abbigliamento',
  documents: 'Documenti',
  books: 'Libri e cancelleria',
  electronics: 'Elettronica e accessori',
  household: 'Articoli per la casa',
  cosmetics: 'Cosmetici e cura personale',
  toys: 'Giocattoli e giochi',
  sports: 'Articoli sportivi',
  spare_parts: 'Ricambi e utensili',
  crafts: 'Artigianato e regali',
  other: 'Altro',
};

export function contentLabel(order) {
  if (order.category_label) return order.category_label;
  const label = contentCategories[order.category] || order.category;
  return order.content_description ? `${label}: ${order.content_description}` : label;
}
