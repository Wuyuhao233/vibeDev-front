import type { CollectionFolder } from '../api/collection';

interface FolderTabsProps {
  folders: CollectionFolder[];
  selectedFolderId: number | null;
  onFolderChange: (folderId: number | null) => void;
  showNewButton?: boolean;
  onNewFolder?: () => void;
}

export default function FolderTabs({
  folders,
  selectedFolderId,
  onFolderChange,
  showNewButton = false,
  onNewFolder,
}: FolderTabsProps) {
  return (
    <div className="flex gap-2 mb-6 border-b border-gray-200 pb-0 overflow-x-auto items-center">
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
      {showNewButton && (
        <button
          onClick={onNewFolder}
          className="pb-2.5 px-2 text-sm text-primary-500 hover:text-primary-600 transition-colors duration-150 whitespace-nowrap"
        >
          + 新建
        </button>
      )}
    </div>
  );
}
