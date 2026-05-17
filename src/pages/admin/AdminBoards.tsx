import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getAdminBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  reorderBoards,
  getBoardTags,
  createBoardTag,
  updateBoardTag,
  deleteBoardTag,
} from '../../api/admin';
import type { AdminBoard, AdminTag } from '../../types/admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Spinner,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '../../components/ui';
import { ErrorEmpty } from '../../components/shared';

export default function AdminBoards() {
  const [boards, setBoards] = useState<AdminBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Board form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<AdminBoard | null>(null);
  const [boardForm, setBoardForm] = useState({ name: '', description: '', icon: '' });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<AdminBoard | null>(null);

  // Tag management modal
  const [tagBoard, setTagBoard] = useState<AdminBoard | null>(null);
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminBoards();
      setBoards(data || []);
    } catch (err: any) {
      setError(err?.message || '加载版块列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // Board CRUD handlers
  function openCreateModal() {
    setEditingBoard(null);
    setBoardForm({ name: '', description: '', icon: '' });
    setModalOpen(true);
  }

  function openEditModal(board: AdminBoard) {
    setEditingBoard(board);
    setBoardForm({
      name: board.name,
      description: board.description || '',
      icon: board.icon || '',
    });
    setModalOpen(true);
  }

  async function handleSaveBoard() {
    if (!boardForm.name) {
      toast.error('版块名称为必填项');
      return;
    }
    setSaving(true);
    try {
      if (editingBoard) {
        await updateBoard(editingBoard.id, boardForm);
        toast.success('版块已更新');
      } else {
        await createBoard({ name: boardForm.name, icon: boardForm.icon, description: boardForm.description });
        toast.success('版块已创建');
      }
      setModalOpen(false);
      fetchBoards();
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteBoard(deleteTarget.id);
      toast.success('版块已删除');
      setDeleteTarget(null);
      fetchBoards();
    } catch (err: any) {
      toast.error(err?.message || '删除失败');
    }
  }

  // Drag-and-drop reorder
  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...boards];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setBoards(reordered);
    setDragIdx(idx);
  }

  async function handleDragEnd() {
    setDragIdx(null);
    try {
      const items = boards.map((b, i) => ({ id: b.id, sortOrder: i + 1 }));
      await reorderBoards(items);
      toast.success('排序已保存');
    } catch {
      toast.error('保存排序失败');
      fetchBoards();
    }
  }

  // Tag management
  async function openTagModal(board: AdminBoard) {
    setTagBoard(board);
    setTagsLoading(true);
    try {
      const data = await getBoardTags(board.id);
      setTags(data || []);
    } catch {
      toast.error('加载标签失败');
    } finally {
      setTagsLoading(false);
    }
  }

  async function handleCreateTag(name: string) {
    if (!tagBoard) return;
    try {
      await createBoardTag(tagBoard.id, { name });
      const data = await getBoardTags(tagBoard.id);
      setTags(data || []);
      toast.success('标签已创建');
    } catch (err: any) {
      toast.error(err?.message || '创建标签失败');
    }
  }

  async function handleDeleteTag(tagId: string) {
    try {
      await deleteBoardTag(tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      toast.success('标签已删除');
    } catch {
      toast.error('删除标签失败');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
        <span className="ml-3 text-muted-foreground">加载中...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorEmpty description={error} onRetry={fetchBoards} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">版块管理</h1>
        <Button onClick={openCreateModal}>新建版块</Button>
      </div>

      {boards.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无版块</EmptyTitle>
            <EmptyDescription>点击上方按钮创建第一个版块</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">名称</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">描述</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">帖子数</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">排序</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board, idx) => (
                <tr
                  key={board.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`border-b border-border hover:bg-muted/30 cursor-move ${
                    dragIdx === idx ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-muted-foreground text-xs">⠿</td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    {board.icon && <span className="mr-2">{board.icon}</span>}
                    {board.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                    {board.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{board.postCount}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{board.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        board.status === 'active'
                          ? 'bg-emerald-50 text-emerald-500'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {board.status === 'active' ? '启用' : '归档'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openTagModal(board)}
                      className="text-xs text-primary hover:text-primary mr-3"
                    >
                      标签
                    </button>
                    <button
                      onClick={() => openEditModal(board)}
                      className="text-xs text-primary hover:text-primary mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setDeleteTarget(board)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Board create/edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBoard ? '编辑版块' : '新建版块'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-foreground mb-1">名称</label>
              <Input
                value={boardForm.name}
                onChange={(e) => setBoardForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="版块名称"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">描述</label>
              <Input
                value={boardForm.description}
                onChange={(e) => setBoardForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="版块描述（可选）"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">图标</label>
              <Input
                value={boardForm.icon}
                onChange={(e) => setBoardForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="emoji 图标（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveBoard} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/80 py-4">
            确定要删除版块「{deleteTarget?.name}」吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag management modal */}
      {tagBoard && (
        <BoardTagModal
          board={tagBoard}
          tags={tags}
          loading={tagsLoading}
          onClose={() => setTagBoard(null)}
          onCreate={handleCreateTag}
          onDelete={handleDeleteTag}
        />
      )}
    </div>
  );
}

function BoardTagModal({
  board,
  tags,
  loading,
  onClose,
  onCreate,
  onDelete,
}: {
  board: AdminBoard;
  tags: AdminTag[];
  loading: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  onDelete: (tagId: string) => void;
}) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  function handleAdd() {
    if (!newName) return;
    setAdding(true);
    onCreate(newName);
    setNewName('');
    setAdding(false);
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>管理标签 - {board.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="标签名称"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={adding || !newName}>
              添加
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : tags.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">暂无标签</p>
          ) : (
            <div className="space-y-1">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/30">
                  <span className="text-sm text-foreground">{tag.name}</span>
                  <button
                    onClick={() => onDelete(tag.id)}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
