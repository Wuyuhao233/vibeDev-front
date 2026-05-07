import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NotificationDropdown from './NotificationDropdown';
import CheckInButton from './CheckInButton';
import { Avatar } from './ui';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
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

        <div className="flex items-center gap-4 flex-1 max-w-lg mx-8">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="搜索帖子..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full h-9 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 transition-all duration-150 placeholder:text-gray-400"
            />
          </div>
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
