import client from './client';

export interface SearchParams {
  q: string;
  type?: 'post' | 'user' | 'board';
  board?: string;
  page?: number;
  pageSize?: number;
}

export async function search(params: SearchParams) {
  const res = await client.get<{ data: { items: any[]; total: number } }>('/search', { params });
  return res.data.data;
}
