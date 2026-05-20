import client from './client';

/** Backend origin for resolving relative upload paths to full URLs */
const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post<{ data: { url: string; filename: string; size: number } }>('/upload', form);
  const data = res.data.data;
  // Backend returns relative path like /uploads/images/2026/05/xxx.jpg
  // Prepend backend origin so <img src> works without proxy reliance
  const fullUrl = data.url.startsWith('http') ? data.url : `${BACKEND_ORIGIN}${data.url}`;
  return { ...data, url: fullUrl };
}
