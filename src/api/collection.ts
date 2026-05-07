import client from './client';

export interface CollectionFolder {
  id: number;
  name: string;
  itemCount: number;
  createdAt: string;
}

export interface CollectionItem {
  postId: number;
  postTitle: string;
  boardName?: string;
  collectedAt: string;
}

export function getFolders(): Promise<CollectionFolder[]> {
  return client
    .get<{ data: CollectionFolder[] }>('/collections')
    .then((res) => res.data.data)
    .catch(() => []);
}

export function createFolder(name: string): Promise<CollectionFolder | null> {
  return client
    .post<{ data: CollectionFolder }>('/collections', { name })
    .then((res) => res.data.data)
    .catch(() => null);
}

export function renameFolder(id: number, name: string): Promise<CollectionFolder | null> {
  return client
    .put<{ data: CollectionFolder }>(`/collections/${id}`, { name })
    .then((res) => res.data.data)
    .catch(() => null);
}

export function deleteFolder(id: number): Promise<boolean> {
  return client
    .delete(`/collections/${id}`)
    .then(() => true)
    .catch(() => false);
}

export function addToFolder(folderId: number, postId: number): Promise<boolean> {
  return client
    .post(`/collections/${folderId}/items`, { postId })
    .then(() => true)
    .catch(() => false);
}

export function removeFromFolder(folderId: number, postId: number): Promise<boolean> {
  return client
    .delete(`/collections/${folderId}/items/${postId}`)
    .then(() => true)
    .catch(() => false);
}

export function moveItems(postIds: number[], targetFolderId: number): Promise<boolean> {
  return client
    .put('/collections/items/move', { postIds, targetFolderId })
    .then(() => true)
    .catch(() => false);
}

export function getFolderItems(
  folderId: number,
  page = 0,
  pageSize = 20,
): Promise<{ items: CollectionItem[]; total: number } | null> {
  return client
    .get<{ data: { items: CollectionItem[]; total: number } }>(`/collections/${folderId}/items`, {
      params: { page, pageSize },
    })
    .then((res) => res.data.data)
    .catch(() => null);
}
