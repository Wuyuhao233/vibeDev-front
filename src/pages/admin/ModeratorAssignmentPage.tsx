import { useState, useEffect, useCallback } from 'react';
import { getModeratorList, updateUserRole, getAdminBoards, getUsers } from '../../api/admin';
import type { AdminBoard } from '../../types/admin';
import { Spinner, ErrorState, Badge, Button } from '../../components/ui';
import { toast } from 'sonner';

interface ModeratorItem {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  level: number;
  email: string;
  boardIds?: string[];
}

export default function ModeratorAssignmentPage() {
  const [moderators, setModerators] = useState<ModeratorItem[]>([]);
  const [boards, setBoards] = useState<AdminBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignModalUser, setAssignModalUser] = useState<ModeratorItem | null>(null);
  const [selectedBoardIds, setSelectedBoardIds] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [modData, boardData] = await Promise.all([
        getModeratorList(),
        getAdminBoards(),
      ]);
      setModerators(modData.items || []);
      setBoards(boardData?.filter((b: AdminBoard) => b.status === 'active') || []);
    } catch (err: any) {
      setError(err?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAssign = (moderator: ModeratorItem) => {
    setAssignModalUser(moderator);
    setSelectedBoardIds(new Set());
  };

  const handleToggleBoard = (boardId: number) => {
    setSelectedBoardIds((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId); else next.add(boardId);
      return next;
    });
  };

  const handleAssign = async () => {
    if (!assignModalUser) return;
    setActionLoading(true);
    try {
      await updateUserRole(assignModalUser.id, 'moderator');
      toast.success('版主权限已更新');
      setAssignModalUser(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeModerator = async (userId: string, username: string) => {
    if (!confirm(`确认撤销 ${username} 的版主权限？`)) return;
    try {
      await updateUserRole(userId, 'user');
      toast.success(`${username} 的版主权限已撤销`);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="加载失败" description={error} onRetry={fetchData} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">版主分配</h1>
          <p className="text-sm text-gray-500 mt-1">管理版主及其管辖版块</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">用户名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">邮箱</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">等级</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">角色</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {moderators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <p className="text-base font-medium text-gray-500">暂无版主</p>
                    <p className="text-sm mt-1">从用户管理中分配版主角色</p>
                  </td>
                </tr>
              ) : (
                moderators.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.username}</td>
                    <td className="px-4 py-3 text-gray-500">{m.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                        Lv.{m.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{m.role === 'admin' ? '管理员' : '版主'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenAssign(m)}
                        >
                          分配版块
                        </Button>
                        {m.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeModerator(m.id, m.username)}
                          >
                            撤销权限
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Board assignment modal */}
      {assignModalUser && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAssignModalUser(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-40">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              分配版块 — {assignModalUser.username}
            </h2>
            <p className="text-sm text-gray-500 mb-4">选择 {assignModalUser.username} 负责管辖的版块</p>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {boards.map((board) => (
                <label
                  key={board.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedBoardIds.has(board.id)}
                    onChange={() => handleToggleBoard(board.id)}
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{board.name}</p>
                    <p className="text-xs text-gray-400">{board.postCount} 篇帖子</p>
                  </div>
                </label>
              ))}
            </div>

            <p className="text-xs text-gray-400 mb-4">
              已选 {selectedBoardIds.size} 个版块
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAssignModalUser(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAssign}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? '保存中...' : '确认分配'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
