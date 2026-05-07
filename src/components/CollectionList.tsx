import type { CollectionFolder, CollectionItem } from '../api/collection';
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
}

export default function CollectionList({
  folders,
  selectedFolderId,
  items,
  loading,
  error,
  onFolderChange,
  onRetry,
}: CollectionListProps) {
  return (
    <div className="collection-list">
      {/* Folder tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-0 overflow-x-auto">
        <button
          onClick={() => onFolderChange(null)}
          className={`pb-2.5 px-1 text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap ${
            selectedFolderId === null
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          全部收藏
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => onFolderChange(folder.id)}
            className={`pb-2.5 px-1 text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap ${
              selectedFolderId === folder.id
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {folder.name}
            <span className="ml-1 text-xs text-gray-400">({folder.itemCount})</span>
          </button>
        ))}
      </div>

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
          description="遇到好内容记得收藏哦"
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.postId} className="py-3">
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
          ))}
        </div>
      )}
    </div>
  );
}
