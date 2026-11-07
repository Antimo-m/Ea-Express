export function normalizePortalText(value) {
  return String(value).normalize('NFC').replace(/[\p{Z}\s]+/gu, ' ').trim();
}

export function normalizeSenderText(data) {
  return Object.fromEntries(Object.entries(data).map(([name, value]) => [name,
    ['name', 'store_name', 'business_type', 'business_description'].includes(name) && typeof value === 'string'
      ? normalizePortalText(value) : value,
  ]));
}

export function portalTextError(value, policy) {
  if (!value || !policy) return null;
  const normalized = normalizePortalText(value).toLowerCase().replace(/[\p{Mn}\p{Cf}]/gu, '').replace(/./gu, character => policy.substitutions[character] ?? character);
  for (const term of policy.terms) {
    const letters = [...term.replace(/[^\p{L}\p{N}]/gu, '')];
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${letters.join('[^\\p{L}\\p{N}]*')}(?![\\p{L}\\p{N}])`, 'u');
    if (pattern.test(normalized)) return policy.message;
  }
  return null;
}
