import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getUsers, updateUser, banUser, unbanUser } from '../../api/admin';
import type { AdminUser } from '../../types/admin';
import {
  Button,
  Input,
  Spinner,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui';
import { ErrorEmpty, PaginationComponent } from '../../components/shared';

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Edit modal
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editLevel, setEditLevel] = useState(1);
  const [saving, setSaving] = useState(false);

  // Ban modal
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('1d');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (keyword) params.search = keyword;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await getUsers(params);
      setUsers(data.items || []);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message || '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch() {
    setKeyword(searchInput);
    setPage(1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  // Edit user
  function openEditModal(user: AdminUser) {
    setEditingUser(user);
    setEditRole(user.role);
    setEditLevel(user.level);
  }

  async function handleSaveUser() {
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUser(editingUser.id, { role: editRole, level: editLevel });
      toast.success('用户信息已更新');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || '更新失败');
    } finally {
      setSaving(false);
    }
  }

  // Ban user
  async function handleBanUser() {
    if (!banTarget) return;
    try {
      await banUser(banTarget.id, { reason: banReason, duration: banDuration });
      toast.success(`已禁言用户 ${banTarget.username}`);
      setBanTarget(null);
      setBanReason('');
      setBanDuration('1d');
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    }
  }

  async function handleUnbanUser(user: AdminUser) {
    try {
      await unbanUser(user.id);
      toast.success(`已解封用户 ${user.username}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    }
  }

  const roleLabels: Record<string, string> = { admin: '管理员', moderator: '版主', user: '用户' };

  function userStatus(u: AdminUser) {
    if (u.isBanned) return { text: '封禁', cls: 'bg-red-50 text-red-500' };
    if (!u.isActivated) return { text: '未激活', cls: 'bg-gray-100 text-gray-400' };
    return { text: '正常', cls: 'bg-emerald-50 text-emerald-500' };
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">用户管理</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索用户名/邮箱..."
          className="w-64"
        />
        <Button variant="outline" size="sm" onClick={handleSearch}>
          搜索
        </Button>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 border border-gray-200 rounded-md text-sm bg-white text-gray-600"
        >
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="moderator">版主</option>
          <option value="user">用户</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 border border-gray-200 rounded-md text-sm bg-white text-gray-600"
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="banned">封禁</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      ) : error ? (
        <ErrorEmpty description={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <Empty>
                  <EmptyHeader>
                    <EmptyTitle>暂无用户</EmptyTitle>
                    {(keyword || roleFilter || statusFilter) && <EmptyDescription>没有匹配的用户</EmptyDescription>}
                  </EmptyHeader>
                </Empty>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">用户</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">邮箱</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">角色</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">等级</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">积分</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">状态</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const st = userStatus(u);
                  return (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                                              {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.username} />}
                                              <AvatarFallback>{u.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                            </Avatar>
                          <span className="text-sm text-gray-900">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{roleLabels[u.role] || u.role}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Lv.{u.level}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{u.points}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-xs text-primary-500 hover:text-primary-600 mr-3"
                        >
                          编辑
                        </button>
                        {u.isBanned ? (
                          <button
                            onClick={() => handleUnbanUser(u)}
                            className="text-xs text-emerald-500 hover:text-emerald-600 mr-3"
                          >
                            解封
                          </button>
                        ) : (
                          <button
                            onClick={() => setBanTarget(u)}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            禁言
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <PaginationComponent currentPage={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Edit user modal */}
      <Dialog open={!!editingUser} onOpenChange={(v) => !v && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户 - {editingUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">角色</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="h-9 w-full px-3 border border-gray-200 rounded-md text-sm bg-white"
              >
                <option value="admin">管理员</option>
                <option value="moderator">版主</option>
                <option value="user">用户</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">等级</label>
              <Input
                type="number"
                min={1}
                max={6}
                value={editLevel}
                onChange={(e) => setEditLevel(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              取消
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban user modal */}
      <Dialog open={!!banTarget} onOpenChange={(v) => !v && setBanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>禁言用户 - {banTarget?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">禁言时长</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="h-9 w-full px-3 border border-gray-200 rounded-md text-sm bg-white"
              >
                <option value="1h">1 小时</option>
                <option value="1d">1 天</option>
                <option value="3d">3 天</option>
                <option value="7d">7 天</option>
                <option value="permanent">永久</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">原因</label>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="禁言原因（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              确认禁言
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
