export function portalTextError(value, policy) {
  if (!value || !policy) return null;
  const normalized = String(value).toLowerCase().replace(/[\p{Mn}\p{Cf}]/gu, '').replace(/./gu, character => policy.substitutions[character] ?? character);
  for (const term of policy.terms) {
    const letters = [...term.replace(/[^\p{L}\p{N}]/gu, '')];
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${letters.join('[^\\p{L}\\p{N}]*')}(?![\\p{L}\\p{N}])`, 'u');
    if (pattern.test(normalized)) return policy.message;
  }
  return null;
}
