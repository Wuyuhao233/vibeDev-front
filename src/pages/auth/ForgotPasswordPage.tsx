import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { EMAIL_PATTERN } from '../../utils/patterns';
import { Button, Input } from '../../components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) {
      setError('请输入邮箱');
      return false;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError('邮箱格式不正确');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      // Show sent state regardless of error (prevent email enumeration)
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="bg-card rounded-lg shadow-card p-8">
          <div className="mb-4 text-4xl">📧</div>
          <h1 className="text-lg font-semibold text-foreground mb-2">邮件已发送</h1>
          <p className="text-sm text-muted-foreground mb-1">
            若该邮箱已注册，重置密码邮件已发送至{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            请检查邮箱（包括垃圾邮件箱），邮件有效期为 30 分钟
          </p>
          <Link
            to="/login"
            className="inline-block px-5 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors duration-150"
          >
            返回登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold text-foreground mb-2 text-center">找回密码</h1>
      <p className="text-sm text-muted-foreground mb-8 text-center">
        输入注册邮箱，我们会发送重置密码链接
      </p>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-card p-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">邮箱</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="example@email.com"
              disabled={loading}
              autoComplete="email"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? '发送中...' : '发送重置邮件'}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            返回登录
          </Link>
        </div>
      </form>
    </div>
  );
}
