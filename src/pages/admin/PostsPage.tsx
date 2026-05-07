import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getAdminPosts, pinPost, unpinPost, markEssence, unmarkEssence, adminDeletePost, movePost } from '../../api/admin';
import { getBoards, Board } from '../../api/board';
import type { AdminPost } from '../../types/admin';
import {
  Button,
  Input,
  Pagination,
  Spinner,
  ErrorState,
  Empty,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui';

const PAGE_SIZE = 20;

export default function PostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [boardIdFilter, setBoardIdFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [boards, setBoards] = useState<Board[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [moveTarget, setMoveTarget] = useState<AdminPost | null>(null);
  const [moveBoardId, setMoveBoardId] = useState<number | ''>('');

  useEffect(() => {
    getBoards().then(setBoards).catch(() => {});
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE };
      if (keyword) params.keyword = keyword;
      if (boardIdFilter) params.boardId = boardIdFilter;
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await getAdminPosts(params);
      setPosts(data.items || []);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message || '加载帖子列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, boardIdFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handleSearch() {
    setKeyword(searchInput);
    setPage(1);
  }

  async function handleTogglePin(post: AdminPost) {
    try {
      if (post.isPinned) {
        await unpinPost(post.id);
        toast.success('已取消置顶');
      } else {
        await pinPost(post.id);
        toast.success('已置顶');
      }
      fetchPosts();
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    }
  }

  async function handleToggleEssence(post: AdminPost) {
    try {
      if (post.isEssence) {
        await unmarkEssence(post.id);
        toast.success('已取消精华');
      } else {
        await markEssence(post.id);
        toast.success('已加精');
      }
      fetchPosts();
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeletePost(deleteTarget.id);
      toast.success('帖子已删除');
      setDeleteTarget(null);
      fetchPosts();
    } catch (err: any) {
      toast.error(err?.message || '删除失败');
    } finally {
      setDeleting(false);
    }
  }

  async function handleMove() {
    if (!moveTarget || !moveBoardId) return;
    try {
      await movePost(moveTarget.id, moveBoardId as number);
      toast.success('帖子已移动');
      setMoveTarget(null);
      setMoveBoardId('');
      fetchPosts();
    } catch (err: any) {
      toast.error(err?.message || '移动失败');
    }
  }

  const statusLabels: Record<string, { text: string; cls: string }> = {
    published: { text: '已发布', cls: 'bg-emerald-50 text-emerald-500' },
    deleted: { text: '已删除', cls: 'bg-red-50 text-red-500' },
    hidden: { text: '已隐藏', cls: 'bg-gray-100 text-gray-400' },
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">帖子管理</h1>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索标题..."
          className="w-48"
        />
        <Button variant="outline" size="sm" onClick={handleSearch}>
          搜索
        </Button>
        <select
          value={boardIdFilter}
          onChange={(e) => { setBoardIdFilter(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
          className="h-9 px-3 border border-gray-200 rounded-md text-sm bg-white text-gray-600"
        >
          <option value="">全部版块</option>
          {boards.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 border border-gray-200 rounded-md text-sm bg-white text-gray-600"
        >
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="deleted">已删除</option>
          <option value="hidden">已隐藏</option>
        </select>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="w-36"
        />
        <span className="text-gray-400 text-sm">至</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="w-36"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      ) : error ? (
        <ErrorState title="加载失败" description={error} onRetry={fetchPosts} />
      ) : posts.length === 0 ? (
        <Empty title="暂无帖子" description={keyword || boardIdFilter || statusFilter ? '没有匹配的帖子' : undefined} />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-1/4">标题</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">作者</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">版块</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">状态</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">时间</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => {
                  const st = statusLabels[p.status] || statusLabels.published;
                  return (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {p.isPinned && <span className="text-blue-500 text-xs font-medium">[置顶]</span>}
                          {p.isEssence && <span className="text-amber-500 text-xs font-medium">[精]</span>}
                          <span className="text-sm text-gray-900 truncate block max-w-xs">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.author.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.board?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${st.cls}`}>{st.text}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(p.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleTogglePin(p)} className="text-xs text-primary-500 hover:text-primary-600 mr-2">
                          {p.isPinned ? '取消置顶' : '置顶'}
                        </button>
                        <button onClick={() => handleToggleEssence(p)} className="text-xs text-amber-500 hover:text-amber-600 mr-2">
                          {p.isEssence ? '取消精华' : '加精'}
                        </button>
                        <button onClick={() => { setMoveTarget(p); setMoveBoardId(''); }} className="text-xs text-primary-500 hover:text-primary-600 mr-2">
                          移动
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="text-xs text-red-500 hover:text-red-600">
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Pagination total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        </>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>强制删除帖子</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-2">确定要强制删除帖子「{deleteTarget?.title}」吗？</p>
            <p className="text-xs text-red-500">此操作不可撤销。</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move modal */}
      <Dialog open={!!moveTarget} onOpenChange={(v) => !v && setMoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移动帖子到其他版块</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-3">帖子：{moveTarget?.title}</p>
            <select
              value={moveBoardId}
              onChange={(e) => setMoveBoardId(Number(e.target.value))}
              className="h-9 w-full px-3 border border-gray-200 rounded-md text-sm bg-white"
            >
              <option value="">选择目标版块</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveTarget(null)}>取消</Button>
            <Button onClick={handleMove} disabled={!moveBoardId}>移动</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
