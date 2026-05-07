import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NotificationDropdown from './NotificationDropdown';
import CheckInButton from './CheckInButton';
import SearchInput from './SearchInput';
import { Avatar } from './ui';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-14 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-content mx-auto flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-primary-500 transition-colors duration-150">
            vibeDev
          </Link>
        </div>

        <div className="flex items-center flex-1 max-w-lg mx-8">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <CheckInButton />

              <button
                onClick={() => navigate('/post/new')}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
              >
                发布帖子
              </button>

              <NotificationDropdown />

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
                >
                  <Avatar name={user?.username || ''} size="sm" />
                  <span className="text-sm text-gray-700 max-w-[100px] truncate">{user?.username}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-modal border border-gray-200 py-1 z-dropdown animate-fade-in">
                    <Link
                      to={`/u/${user?.username}`}
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    >
                      个人中心
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    >
                      设置
                    </Link>
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    >
                      管理后台
                    </Link>
                    <hr className="border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors duration-150"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
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
  );
}
