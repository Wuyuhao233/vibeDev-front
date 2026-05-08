import client from './client';

export async function uploadFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post<{ data: { url: string; filename: string; size: number } }>('/upload', form);
  return res.data.data;
}
