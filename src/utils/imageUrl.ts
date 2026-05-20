/**
 * Normalize an avatar/image URL to a full absolute URL.
 *
 * The backend returns relative paths like `/uploads/xxx.jpg`.
 * <img> tags don't go through the Vite proxy, so we must
 * prepend the backend origin to make them directly accessible.
 */
const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';

export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Already a full URL — return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path like /uploads/images/... — prepend backend origin
  if (url.startsWith('/')) return `${BACKEND_ORIGIN}${url}`;
  // Other (data: URLs, etc.) — return as-is
  return url;
}
