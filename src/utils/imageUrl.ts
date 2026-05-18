/**
 * Normalize an avatar/image URL to a relative path.
 *
 * Old backend versions returned full URLs like `http://localhost:8080/uploads/xxx.jpg`.
 * The current backend returns relative paths like `/uploads/xxx.jpg`.
 * This utility strips any origin prefix so the URL works through the Vite proxy.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, 'http://placeholder');
    // If the URL has an origin (was a full URL), extract just the pathname
    if (parsed.origin !== 'http://placeholder') {
      return parsed.pathname;
    }
  } catch {
    // Not a valid URL, return as-is
  }
  return url;
}
