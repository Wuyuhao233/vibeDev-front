import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import * as authApi from '../../api/auth';
import { ApiError } from '../../utils/error';
import { Button, Input, toast } from '../../components/ui';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [casLoading, setCasLoading] = useState(false);

  // Locked countdown timer
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      if (remaining <= 0) {
        setLockedUntil(null);
        setError('');
      } else {
        setCooldown(remaining);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  // Rate limit cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // CAS ticket callback handling
  useEffect(() => {
    const ticket = searchParams.get('ticket');
    const service = searchParams.get('service');
    if (!ticket || !service) return;

    setCasLoading(true);
    (async () => {
      try {
        const res = await authApi.casLogin(ticket, service);
        login(res.user, res.accessToken, res.refreshToken);
        toast.success('CAS 登录成功');
        // Clean URL params and navigate
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('ticket');
        newParams.delete('service');
        setSearchParams(newParams, { replace: true });
        const redirectTo = newParams.get('redirect') || '/';
        navigate(redirectTo, { replace: true });
      } catch (err) {
        setCasLoading(false);
        if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error('CAS 登录失败，请重试');
        }
        // Clean URL params
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('ticket');
        newParams.delete('service');
        setSearchParams(newParams, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const redirect = searchParams.get('redirect') || '/';

  const handleCasLogin = () => {
    const redirectUri = window.location.origin + '/login';
    window.location.href = `/api/v1/auth/cas/authorize?redirect=${encodeURIComponent(redirectUri)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    if (!username.trim()) {
      setError('请输入用户名或邮箱');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({ usernameOrEmail: username.trim(), password, rememberMe });
      login(res.user, res.accessToken, res.refreshToken);
      toast.success('登录成功');
      navigate(redirect, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const code = err.code;
        if (code === 'ACCOUNT_LOCKED (10003)') {
          setLockedUntil(Date.now() + 15 * 60 * 1000);
          setError('账号已锁定，请 15 分钟后重试');
        } else if (code === 'ACCOUNT_NOT_ACTIVATED (10004)') {
          setError('账号未激活，请检查邮箱中的验证邮件');
        } else if (code === 'PASSWORD_WRONG (10005)') {
          setError('密码不正确');
          setPassword('');
        } else if (code === 'NOT_FOUND (30001)') {
          setError('该账号不存在，请检查输入或前往注册');
        } else if (code === 'RATE_LIMITED (40001)') {
          setCooldown(60);
          setError('操作过于频繁，请稍后重试');
        } else if (code === 'BANNED (20002)') {
          setError('你的账号已被封禁，如有疑问请联系管理员');
        } else {
          setError(err.message);
        }
      } else {
        toast.error('网络连接失败，请检查网络');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} 分 ${s} 秒`;
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold text-foreground mb-8 text-center">登录</h1>

      {lockedUntil ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="mb-3 text-2xl">⚠</div>
          <h2 className="text-lg font-semibold text-amber-800 mb-2">账号已临时锁定</h2>
          <p className="text-sm text-amber-700 mb-4">
            由于密码错误次数过多，你的账号已被锁定 15 分钟。请稍后再试。
          </p>
          <p className="text-sm font-medium text-amber-800 mb-4">
            剩余解锁时间：{formatTime(cooldown)}
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              忘记密码？
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:underline">
              返回首页
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-card p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
              {error.includes('未激活') && (
                <div className="mt-2">
                  <Link to="/register" className="text-primary hover:underline text-sm">
                    重新注册
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">用户名 / 邮箱</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名或邮箱"
                disabled={loading || cooldown > 0}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">密码</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  disabled={loading || cooldown > 0}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/80"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground/80">记住我</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                忘记密码？
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading || cooldown > 0}
              size="lg"
              className="w-full mt-2"
            >
              {loading ? '登录中...' : cooldown > 0 ? `请等待 ${cooldown}s` : '登录'}
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            还没有账号？
            <Link to="/register" className="text-primary hover:underline ml-1">
              注册
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">或</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="mt-4">
            {casLoading ? (
              <div className="text-center text-sm text-muted-foreground">
                <span className="inline-block animate-spin-slow w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2 align-middle" />
                CAS 登录中...
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="default"
                className="w-full"
                onClick={handleCasLogin}
              >
                CAS 登录
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
