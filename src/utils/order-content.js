export const contentCategories = {
  custom: 'Scrivi il contenuto',
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
  if (order.category === 'custom') return order.content_description || 'Contenuto non specificato';
  const label = contentCategories[order.category] || order.category;
  return order.content_description ? `${label}: ${order.content_description}` : label;
}

export function contentFormData(value, original = null) {
  if (original && value === contentLabel(original)) return {category: original.category, content_description: original.content_description || ''};
  const category = Object.entries(contentCategories).find(([key, label]) => key !== 'custom' && label === value)?.[0];
  return {category: category || 'custom', content_description: category ? '' : value};
}
