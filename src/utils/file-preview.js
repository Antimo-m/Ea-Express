/**
 * Anteprime degli allegati come URL data: (consentiti dalla Content-Security-Policy del portale, a differenza di blob:).
 * Restituisce null per i file non visualizzabili come immagine (PDF, testo, HEIC non supportato dai browser).
 */
export const previewable = (file) => Boolean(file?.type?.startsWith("image/")) && !/heic|heif/i.test(file.type);

export function readPreview(file, Reader = globalThis.FileReader) {
  if (!previewable(file) || !Reader) return Promise.resolve(null);
  return new Promise((resolve) => {
    const reader = new Reader();
    reader.onload = () => resolve(typeof reader.result === "string" && reader.result.startsWith("data:image/") ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
