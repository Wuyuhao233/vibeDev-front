import client from './client';

export async function uploadFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post<{ data: { url: string } }>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
