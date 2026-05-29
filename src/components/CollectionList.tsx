import type { CollectionFolder, CollectionItem } from '../api/collection';
import FolderTabs from './FolderTabs';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from './ui';
import { ErrorEmpty } from './shared';

interface CollectionListProps {
  folders: CollectionFolder[];
  selectedFolderId: string | null;
  items: CollectionItem[];
  loading: boolean;
  error: string | null;
  onFolderChange: (folderId: string | null) => void;
  onRetry: () => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (postId: string) => void;
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
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin-slow" />
          <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
        </div>
      ) : error ? (
        <ErrorEmpty description={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无收藏</EmptyTitle>
            <EmptyDescription>{selectedFolderId === null ? '遇到好内容记得收藏哦' : '该收藏夹为空'}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="divide-y divide-border">
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
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                  </label>
                )}
                <div className="flex-1 min-w-0">
                  <a
                    href={`/post/${item.postId}`}
                    className="text-sm text-foreground hover:text-primary transition-colors duration-150"
                  >
                    {item.postTitle}
                  </a>
                  {item.boardName && (
                    <span className="ml-2 text-xs text-muted-foreground">{item.boardName}</span>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
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
