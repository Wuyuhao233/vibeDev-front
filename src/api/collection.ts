import client from './client';

export interface CollectionFolder {
  id: string;
  name: string;
  version: number;
  createdAt: string;
}

export interface CollectionItem {
  postId: string;
  postTitle: string;
  boardName: string;
  collectedAt: string;
  postSummary: {
    id: string;
    title: string;
    authorName: string;
    boardName: string;
    isDeleted: boolean;
  };
}

/** 获取收藏夹列表 GET /favorites/folders */
export function getFolders(): Promise<CollectionFolder[]> {
  return client
    .get<{ data: CollectionFolder[] }>('/favorites/folders')
    .then((res) => Array.isArray(res.data.data) ? res.data.data : [])
    .catch(() => []);
}

/** 创建收藏夹 POST /favorites/folders */
export function createFolder(name: string): Promise<CollectionFolder | null> {
  return client
    .post<{ data: CollectionFolder }>('/favorites/folders', { name })
    .then((res) => res.data.data ?? null)
    .catch(() => null);
}

/** 重命名收藏夹 PUT /favorites/folders/{id} */
export function renameFolder(id: string, name: string): Promise<CollectionFolder | null> {
  return client
    .put<{ data: CollectionFolder }>(`/favorites/folders/${id}`, { name })
    .then((res) => res.data.data ?? null)
    .catch(() => null);
}

/** 删除收藏夹 DELETE /favorites/folders/{id} */
export function deleteFolder(id: string): Promise<boolean> {
  return client
    .delete(`/favorites/folders/${id}`)
    .then(() => true)
    .catch(() => false);
}

/** 获取收藏列表（分页） GET /favorites */
export function getFavorites(
  page = 1,
  limit = 20,
  folderId?: string,
): Promise<{ items: CollectionItem[]; total: number } | null> {
  return client
    .get<{
      data: {
        items: Array<{
          id: string;
          postId: string;
          createdAt: string;
          post: {
            id: string;
            title: string;
            authorName: string;
            boardName: string;
            isDeleted: boolean;
          } | null;
        }>;
        total: number;
      };
    }>('/favorites', { params: { page, limit, folderId } })
    .then((res) => {
      const data = res.data.data;
      if (!data || !data.items) return null;
      return {
        items: data.items.map((item) => ({
          postId: item.postId,
          postTitle: item.post?.title ?? '(已删除)',
          boardName: item.post?.boardName ?? '',
          collectedAt: item.createdAt,
          postSummary: item.post ?? {
            id: item.postId,
            title: '(已删除)',
            authorName: '',
            boardName: '',
            isDeleted: true,
          },
        })),
        total: data.total,
      };
    })
    .catch(() => null);
}

/** 移动收藏到目标收藏夹 PUT /favorites/folders/{id}/items */
export function moveItems(postIds: string[], targetFolderId: string): Promise<boolean> {
  return client
    .put(`/favorites/folders/${targetFolderId}/items`, { postIds, targetFolderId })
    .then(() => true)
    .catch(() => false);
}
