import { useState, useEffect, useRef } from 'react';
import { getFolders, type CollectionFolder } from '../api/collection';

interface FolderSelectorProps {
  open: boolean;
  onSelect: (folderId: string, folderName: string) => void;
  onClose: () => void;
}

export default function FolderSelector({ open, onSelect, onClose }: FolderSelectorProps) {
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getFolders()
      .then(setFolders)
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 mt-1 w-56 bg-card rounded-lg shadow-modal border border-border z-10 py-1"
    >
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin-slow" />
          <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
        </div>
      ) : (
        <>
          <button
            onClick={() => onSelect('', '默认收藏夹')}
            className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted/30 transition-colors duration-150"
          >
            <span>默认收藏夹</span>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onSelect(folder.id, folder.name)}
              className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted/30 transition-colors duration-150 flex items-center justify-between"
            >
              <span>{folder.name}</span>
            </button>
          ))}
          {!loading && folders.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground">暂无收藏夹，点击"管理收藏夹"创建</p>
          )}
        </>
      )}
    </div>
  );
}
