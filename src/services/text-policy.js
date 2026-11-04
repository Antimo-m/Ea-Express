import { request } from '../api/client.js';
import { portalTextError } from '../utils/text-policy.js';

let definition;
let pending;

export function loadTextPolicy() {
  if (definition) return Promise.resolve(definition);
  if (!pending) {
    pending = request('/text-policy').then(payload => {
      if (!Array.isArray(payload.terms) || !payload.terms.every(term => typeof term === 'string' && /[\p{L}\p{N}]/u.test(term)) || !payload.substitutions || typeof payload.substitutions !== 'object' || !Object.values(payload.substitutions).every(value => typeof value === 'string') || typeof payload.message !== 'string') throw new Error('Non è stato possibile verificare il testo. Riprova.');
      definition = payload;
      return definition;
    }).finally(() => { pending = null; });
  }
  return pending;
}

export async function validatePortalText(data) {
  const policy = await loadTextPolicy();
  const errors = {};
  for (const name of ['business_type', 'content_description']) {
    if (name === 'business_type' && data.sender_type === 'private') continue;
    const error = portalTextError(data[name], policy);
    if (error) errors[name] = [error];
  }
  return errors;
}
