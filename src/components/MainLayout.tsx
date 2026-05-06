import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import Avatar from './ui/Avatar';

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-20 h-14 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-content mx-auto flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-gray-900">
              vibeDev
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-sm text-gray-600 hover:text-primary-500 transition-colors duration-150">
                首页
              </Link>
              <Link to="/search" className="text-sm text-gray-600 hover:text-primary-500 transition-colors duration-150">
                搜索
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/post/new')}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
                >
                  发布帖子
                </button>
                <Link
                  to="/notifications"
                  className="relative text-sm text-gray-600 hover:text-primary-500 transition-colors duration-150"
                >
                  通知
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to={`/u/${user?.username}`} className="flex items-center gap-2">
                  <Avatar name={user?.username || ''} size={32} />
                  <span className="text-sm text-gray-700">{user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  退出
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-primary-500 transition-colors duration-150"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-content mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
