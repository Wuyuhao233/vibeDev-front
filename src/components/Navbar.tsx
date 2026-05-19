import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NotificationDropdown from './NotificationDropdown';
import CheckInButton from './CheckInButton';
import SearchInput from './SearchInput';
import ThemeToggle from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from './ui';
import { normalizeImageUrl } from '../utils/imageUrl';

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
    <header className="sticky top-0 z-20 h-14 bg-card border-b border-border shadow-sm">
      <div className="max-w-content mx-auto flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors duration-150">
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

              <ThemeToggle />

              <button
                onClick={() => navigate('/post/new')}
                className="px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors duration-150"
              >
                发布帖子
              </button>

              <NotificationDropdown />

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-md hover:bg-muted transition-colors duration-150"
                >
                  <Avatar size="sm">
                    {user?.avatarUrl && <AvatarImage src={normalizeImageUrl(user.avatarUrl)} alt={user?.username || ''} />}
                    <AvatarFallback>{user?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground max-w-[100px] truncate">{user?.username}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`text-muted-foreground transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-lg shadow-modal border border-border py-1 z-dropdown animate-fade-in">
                    <Link
                      to={`/u/${user?.username}`}
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150"
                    >
                      个人中心
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150"
                    >
                      设置
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'moderator') && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150"
                      >
                        管理后台
                      </Link>
                    )}
                    <hr className="border-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors duration-150"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors duration-150"
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
