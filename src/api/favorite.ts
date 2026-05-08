import client from './client';

export interface FavoriteItem {
  id: string;
  userId: string;
  postId: string;
  collectionFolderId: string | null;
  createdAt: string;
  post: {
    id: string;
    title: string;
    titleDisplay: string;
    authorName: string;
    boardName: string;
    isDeleted: boolean;
  };
}

export interface GetFavoritesResult {
  items: FavoriteItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CollectionFolder {
  id: string;
  userId: string;
  name: string;
  version: number;
  createdAt: string;
}

export async function getFavorites(params?: { page?: number; limit?: number; folderId?: string }) {
  const res = await client.get<{ data: GetFavoritesResult }>('/favorites', { params });
  return res.data.data;
}

export async function createFolder(name: string) {
  const res = await client.post<{ data: CollectionFolder }>('/favorites/folders', { name });
  return res.data.data;
}

export async function getFolders() {
  const res = await client.get<{ data: CollectionFolder[] }>('/favorites/folders');
  return res.data.data;
}

export async function updateFolder(id: string, data: { name: string; version: number }) {
  const res = await client.put<{ data: CollectionFolder }>(`/favorites/folders/${id}`, data);
  return res.data.data;
}

export async function deleteFolder(id: string) {
  await client.delete(`/favorites/folders/${id}`);
}

export async function moveToFolder(data: { postIds: string[]; targetFolderId: string | null }) {
  const res = await client.put<{ data: { movedCount: number } }>('/favorites/folders/move', data);
  return res.data.data;
}
