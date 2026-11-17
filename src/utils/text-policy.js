export function normalizePortalText(value) {
  return String(value).normalize('NFC').replace(/[\p{Z}\s]+/gu, ' ').trim();
}

export function normalizeSenderText(data) {
  return Object.fromEntries(Object.entries(data).map(([name, value]) => [name,
    ['name', 'store_name', 'business_type', 'business_description'].includes(name) && typeof value === 'string'
      ? normalizePortalText(value) : value,
  ]));
}

/** Mirrors App\\Support\\PortalTextPolicy::comparable(): the submitted value is never changed. */
export function comparablePortalText(value, substitutions = {}, lettersOnly = false) {
  let text = normalizePortalText(String(value).normalize('NFKC')).toLowerCase();
  text = [...text].map(character => substitutions[character] ?? character).join('');
  text = text.normalize('NFD').replace(/[\p{Mn}\p{Cf}]/gu, '');
  if (lettersOnly) text = text.replace(/[^\p{L}\p{N}]/gu, '');
  return text.replace(/(\p{L})\1+/gu, '$1');
}

export function portalTextError(value, policy) {
  if (!value || !policy) return null;
  const text = comparablePortalText(value, policy.substitutions);
  for (const term of policy.terms) {
    const stem = term.endsWith('*');
    const letters = [...comparablePortalText(term.replace(/\*$/, ''), policy.substitutions, true)].map(letter => letter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${letters.join('[^\\p{L}\\p{N}]*')}${stem ? '' : '(?![\\p{L}\\p{N}])'}`, 'u');
    if (pattern.test(text)) return policy.message;
  }
  return null;
}
