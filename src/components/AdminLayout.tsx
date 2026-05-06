import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Avatar from './ui/Avatar';

const adminNavItems = [
  { label: '仪表盘', path: '/admin' },
  { label: '用户管理', path: '/admin/users' },
  { label: '帖子管理', path: '/admin/posts' },
  { label: '举报管理', path: '/admin/reports' },
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
          {adminNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                location.pathname === item.path
                  ? 'bg-primary-50 text-primary-500 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 flex items-center gap-3">
          <Avatar name={user?.username || ''} size={32} />
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
