import { useState, useRef, useEffect } from 'react';
import { getFolders, type CollectionFolder } from '../api/collection';

interface BatchMoveBarProps {
  selectedCount: number;
  onMove: (targetFolderId: number) => void;
  onCancel: () => void;
}

export default function BatchMoveBar({ selectedCount, onMove, onCancel }: BatchMoveBarProps) {
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [selectedTargetName, setSelectedTargetName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getFolders().then((data) => {
      if (data.length > 0) setFolders(data);
    });
  }, []);

  const handleSelectFolder = (folderId: number, folderName: string) => {
    setSelectedTargetId(folderId);
    setSelectedTargetName(folderName);
    setOpen(false);
  };

  const handleConfirm = () => {
    if (selectedTargetId === null) return;
    onMove(selectedTargetId);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-drawer px-6 py-3 flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">
        已选 {selectedCount} 项
      </span>

      <div className="flex items-center gap-3">
        <div ref={containerRef} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
          >
            <span>{selectedTargetName || '选择收藏夹'}</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute bottom-full left-0 mb-1 w-56 bg-white rounded-lg shadow-modal border border-gray-200 z-10 py-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleSelectFolder(folder.id, folder.name)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
                >
                  <span>{folder.name}</span>
                  <span className="text-xs text-gray-400">{folder.itemCount}</span>
                </button>
              ))}
              {folders.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">暂无收藏夹</p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedTargetId === null}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors duration-150"
        >
          确定
        </button>

        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150"
        >
          取消
        </button>
      </div>
    </div>
  );
}
