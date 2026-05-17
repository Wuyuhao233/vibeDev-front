import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, toast } from './ui';
import {
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  type CollectionFolder,
} from '../api/collection';

interface CollectionFolderManagerProps {
  open: boolean;
  onClose: () => void;
}

const FOLDER_NAME_MAX = 20;

export default function CollectionFolderManager({ open, onClose }: CollectionFolderManagerProps) {
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    getFolders()
      .then((data) => {
        setFolders(data);
      })
      .catch(() => setError('加载失败，请重试'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) fetch();
  }, [open, fetch]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length > FOLDER_NAME_MAX) return;
    setCreating(true);
    const folder = await createFolder(trimmed);
    setCreating(false);
    if (folder) {
      setFolders((prev) => [...prev, folder]);
      setNewName('');
      toast.success('收藏夹已创建');
    } else {
      toast.error('创建失败，功能暂未开放');
    }
  };

  const handleStartRename = (folder: CollectionFolder) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  const handleSaveRename = async (id: number) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed.length > FOLDER_NAME_MAX) return;
    setSaving(true);
    const updated = await renameFolder(id, trimmed);
    setSaving(false);
    if (updated) {
      setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
      setEditingId(null);
      toast.success('收藏夹已重命名');
    } else {
      toast.error('重命名失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    const ok = await deleteFolder(id);
    setSaving(false);
    if (ok) {
      setFolders((prev) => prev.filter((f) => f.id !== id));
      toast.success('收藏夹已删除');
    } else {
      toast.error('删除失败，请重试');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>管理收藏夹</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Create */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="新收藏夹名称"
              maxLength={FOLDER_NAME_MAX}
              className="flex-1 border border-border rounded px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded hover:bg-primary/90 disabled:opacity-50 transition-colors duration-150"
            >
              {creating ? '创建中...' : '创建'}
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin-slow" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{error}</div>
          ) : folders.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无收藏夹</div>
          ) : (
            <div className="divide-y divide-border">
              {folders.map((folder) => (
                <div key={folder.id} className="flex items-center justify-between py-3">
                  {editingId === folder.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(folder.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        maxLength={FOLDER_NAME_MAX}
                        autoFocus
                        className="flex-1 border border-border rounded px-2 py-1 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-150"
                      />
                      <button
                        onClick={() => handleSaveRename(folder.id)}
                        disabled={saving || !editName.trim()}
                        className="text-xs text-primary hover:text-primary disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button onClick={cancelEdit} className="text-xs text-muted-foreground hover:text-foreground/80">
                        取消
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{folder.name}</span>
                        <span className="text-xs text-muted-foreground">{folder.itemCount} 项</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleStartRename(folder)}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors duration-150"
                        >
                          重命名
                        </button>
                        <button
                          onClick={() => handleDelete(folder.id)}
                          disabled={saving}
                          className="text-xs text-muted-foreground hover:text-red-500 transition-colors duration-150"
                        >
                          删除
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
