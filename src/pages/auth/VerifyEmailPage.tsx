import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { ApiError } from '../../utils/error';
import { Spinner, Button } from '../../components/ui';

type State = 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<State>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('无效的验证链接');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await authApi.verifyEmail(token);
        if (!cancelled) setState('success');
      } catch (err) {
        if (cancelled) return;
        setState('error');
        if (err instanceof ApiError) {
          if (err.code === 'TOKEN_EXPIRED (10002)') {
            setErrorMessage('验证链接已过期（有效期 1 小时），请重新注册');
          } else if (err.code === 'NOT_FOUND (30001)') {
            setErrorMessage('该验证链接已被使用，你的账号可能已激活，请前往登录');
          } else {
            setErrorMessage(err.message);
          }
        } else {
          setErrorMessage('网络连接失败，请检查网络后重试');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  // Auto-redirect on success
  useEffect(() => {
    if (state !== 'success') return;
    if (countdown <= 0) {
      window.location.href = '/login';
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, countdown]);

  if (state === 'verifying') {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="bg-card rounded-lg shadow-card p-8">
          <Spinner className="mb-4" />
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="bg-card rounded-lg shadow-card p-8">
          <div className="mb-4 text-5xl text-emerald-500">✓</div>
          <h1 className="text-lg font-semibold text-foreground mb-2">邮箱验证成功</h1>
          <p className="text-sm text-muted-foreground mb-6">
            账号已激活，{countdown} 秒后自动跳转登录页
          </p>
          <Link
            to="/login"
            className="inline-block px-5 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors duration-150"
          >
            立即登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="bg-card rounded-lg shadow-card p-8">
        <div className="mb-4 text-5xl text-red-500">✕</div>
        <h1 className="text-lg font-semibold text-foreground mb-2">验证失败</h1>
        <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
        <div className="flex justify-center gap-3">
          <Link to="/register">
            <Button variant="outline">重新注册</Button>
          </Link>
          <Link to="/">
            <Button variant="ghost">返回首页</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
