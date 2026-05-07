import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './ui';

interface NavItem {
  label: string;
  path: string;
  roles: ('admin' | 'moderator')[];
}

const adminNavItems: NavItem[] = [
  { label: '仪表盘', path: '/admin', roles: ['admin', 'moderator'] },
  { label: '版块管理', path: '/admin/boards', roles: ['admin'] },
  { label: '用户管理', path: '/admin/users', roles: ['admin'] },
  { label: '帖子管理', path: '/admin/posts', roles: ['admin'] },
  { label: '审核队列', path: '/admin/moderation', roles: ['admin', 'moderator'] },
  { label: '举报管理', path: '/admin/reports', roles: ['admin', 'moderator'] },
  { label: '敏感词库', path: '/admin/sensitive-words', roles: ['admin'] },
  { label: 'AI 审核', path: '/admin/review-queue', roles: ['admin', 'moderator'] },
  { label: '审核统计', path: '/admin/review-stats', roles: ['admin'] },
  { label: '版主分配', path: '/admin/moderator-assignment', roles: ['admin'] },
  { label: '申诉复审', path: '/admin/appeals', roles: ['admin'] },
  { label: '系统设置', path: '/admin/settings', roles: ['admin'] },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-sidebar flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <Link to="/" className="text-lg font-bold text-gray-900">
            vibeDev
          </Link>
          <p className="text-xs text-gray-400 mt-1">管理后台</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNavItems
            .filter((item) => user && item.roles.includes(user.role as 'admin' | 'moderator'))
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                  location.pathname.startsWith(item.path)
                    ? 'bg-primary-50 text-primary-500 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="p-4 border-t border-gray-100 flex items-center gap-3">
          <Avatar name={user?.username || ''} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">{user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            退出
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 h-14 bg-white border-b border-gray-200 flex items-center px-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-primary-500">
            ← 返回前台
          </Link>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
