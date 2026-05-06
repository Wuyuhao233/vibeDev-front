import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { ApiError } from '../../utils/error';
import { PASSWORD_PATTERN } from '../../utils/patterns';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';

type PageState = 'form' | 'success';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [pageState, setPageState] = useState<PageState>('form');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [tokenInvalid, setTokenInvalid] = useState(false);

  if (!token || tokenInvalid) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="bg-white rounded-lg shadow-card p-8">
          <div className="mb-4 text-5xl text-red-500">✕</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            {tokenInvalid ? '链接已过期或无效' : '无效的重置链接'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            该重置链接无效或已被使用，请重新发起密码重置
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-5 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
          >
            重新发起
          </Link>
        </div>
      </div>
    );
  }

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      setPasswordError('密码至少 8 位');
      return false;
    }
    if (!PASSWORD_PATTERN.test(value)) {
      setPasswordError('密码需包含大小写字母和数字');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirm = (value: string, pwd: string) => {
    if (value !== pwd) {
      setConfirmError('两次输入的密码不一致');
      return false;
    }
    setConfirmError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    const validPwd = validatePassword(password);
    const validConfirm = validateConfirm(confirmPassword, password);

    if (!validPwd || !validConfirm) return;

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setPageState('success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'TOKEN_EXPIRED (10002)') {
          setTokenInvalid(true);
        } else if (err.code === 'NOT_FOUND (30001)') {
          setTokenInvalid(true);
        } else if (err.code === 'RATE_LIMITED (40001)') {
          setGlobalError('操作过于频繁，请稍后重试');
        } else {
          setGlobalError(err.message);
        }
      } else {
        toast.error('提交失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageState === 'success') {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="bg-white rounded-lg shadow-card p-8">
          <div className="mb-4 text-5xl text-emerald-500">✓</div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">密码重置成功</h1>
          <p className="text-sm text-gray-500 mb-6">
            请使用新密码重新登录
          </p>
          <Link
            to="/login"
            className="inline-block px-5 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">重置密码</h1>
      <p className="text-sm text-gray-500 mb-8 text-center">请输入你的新密码</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-card p-6">
        {globalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {globalError}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Input
              label="新密码"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
                if (confirmPassword) validateConfirm(confirmPassword, e.target.value);
              }}
              placeholder="至少 8 位，包含大小写字母和数字"
              error={passwordError}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 text-sm"
              tabIndex={-1}
            >
              {showPassword ? '隐藏' : '显示'}
            </button>
          </div>

          <Input
            label="确认新密码"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              validateConfirm(e.target.value, password);
            }}
            placeholder="请再次输入新密码"
            error={confirmError}
            disabled={loading}
            autoComplete="new-password"
          />

          <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
            {loading ? '重置中...' : '重置密码'}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-primary-500 hover:underline">
            返回登录
          </Link>
        </div>
      </form>
    </div>
  );
}
