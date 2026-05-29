import type { CollectionFolder } from '../api/collection';

interface FolderTabsProps {
  folders: CollectionFolder[];
  selectedFolderId: string | null;
  onFolderChange: (folderId: string | null) => void;
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
    <div className="flex gap-2 mb-6 border-b border-border pb-0 overflow-x-auto items-center">
      <button
        onClick={() => onFolderChange(null)}
        className={`pb-2.5 px-1 text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap ${
          selectedFolderId === null
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
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
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {folder.name}
        </button>
      ))}
      {showNewButton && (
        <button
          onClick={onNewFolder}
          className="pb-2.5 px-2 text-sm text-primary hover:text-primary transition-colors duration-150 whitespace-nowrap"
        >
          + 新建
        </button>
      )}
    </div>
  );
}
