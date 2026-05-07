import type { CollectionFolder, CollectionItem } from '../api/collection';
import FolderTabs from './FolderTabs';
import EmptyState from './ui/EmptyState';
import ErrorState from './ui/ErrorState';

interface CollectionListProps {
  folders: CollectionFolder[];
  selectedFolderId: number | null;
  items: CollectionItem[];
  loading: boolean;
  error: string | null;
  onFolderChange: (folderId: number | null) => void;
  onRetry: () => void;
  selectable?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (postId: number) => void;
  onNewFolder?: () => void;
}

export default function CollectionList({
  folders,
  selectedFolderId,
  items,
  loading,
  error,
  onFolderChange,
  onRetry,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onNewFolder,
}: CollectionListProps) {
  return (
    <div className="collection-list">
      <FolderTabs
        folders={folders}
        selectedFolderId={selectedFolderId}
        onFolderChange={onFolderChange}
        showNewButton={selectable}
        onNewFolder={onNewFolder}
      />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin-slow" />
          <span className="ml-2 text-sm text-gray-400">加载中...</span>
        </div>
      ) : error ? (
        <ErrorState title="加载收藏失败" description={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState
          title="暂无收藏"
          description={selectedFolderId === null ? '遇到好内容记得收藏哦' : '该收藏夹为空'}
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const isSelected = selectedIds?.has(item.postId) ?? false;
            return (
              <div key={item.postId} className="flex items-center gap-3 py-3">
                {selectable && (
                  <label className="flex-shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(item.postId)}
                      className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </label>
                )}
                <div className="flex-1 min-w-0">
                  <a
                    href={`/post/${item.postId}`}
                    className="text-sm text-gray-900 hover:text-primary-500 transition-colors duration-150"
                  >
                    {item.postTitle}
                  </a>
                  {item.boardName && (
                    <span className="ml-2 text-xs text-gray-400">{item.boardName}</span>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(item.collectedAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
