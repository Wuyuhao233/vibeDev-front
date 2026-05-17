import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { ApiError } from '../../utils/error';
import { USERNAME_PATTERN, EMAIL_PATTERN, PASSWORD_PATTERN } from '../../utils/patterns';
import { Button, Input, toast } from '../../components/ui';

const CODE_COUNTDOWN = 60;

function getPasswordStrength(pwd: string): { label: string; level: number; color: string } {
  if (pwd.length < 8) return { label: '弱', level: 1, color: 'bg-red-500' };
  let score = 0;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: '弱', level: 1, color: 'bg-red-500' };
  if (score <= 2) return { label: '中', level: 2, color: 'bg-amber-500' };
  if (score === 3) return { label: '强', level: 3, color: 'bg-emerald-500' };
  return { label: '很强', level: 3, color: 'bg-emerald-500' };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  // Send code countdown
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (codeCountdown <= 0) return;
    countdownRef.current = setTimeout(() => setCodeCountdown(codeCountdown - 1), 1000);
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [codeCountdown]);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('请输入邮箱');
      return false;
    }
    if (!EMAIL_PATTERN.test(value)) {
      setEmailError('邮箱格式不正确');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validateCode = (value: string) => {
    if (!value.trim()) {
      setCodeError('请输入验证码');
      return false;
    }
    if (!/^\d{6}$/.test(value)) {
      setCodeError('验证码为6位数字');
      return false;
    }
    setCodeError('');
    return true;
  };

  const validateUsername = useCallback((value: string) => {
    if (!value.trim()) {
      setUsernameError('请输入用户名');
      return false;
    }
    if (!USERNAME_PATTERN.test(value)) {
      setUsernameError('用户名需 3-20 个字符，仅支持英文、数字和下划线');
      return false;
    }
    setUsernameError('');
    return true;
  }, []);

  const checkUsernameAvailability = useCallback(async (value: string) => {
    if (!USERNAME_PATTERN.test(value)) return;
    setCheckingUsername(true);
    setUsernameAvailable(false);
    try {
      await authApi.checkUsername(value);
      setUsernameAvailable(true);
      setUsernameError('');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'USERNAME_TAKEN (10006)') {
        setUsernameError('用户名已被占用');
      }
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    validateUsername(value);
    setUsernameAvailable(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (USERNAME_PATTERN.test(value)) {
      debounceRef.current = setTimeout(() => checkUsernameAvailability(value), 300);
    }
  };

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

  const validateConfirmPassword = (value: string, pwd: string) => {
    if (value !== pwd) {
      setConfirmError('两次输入的密码不一致');
      return false;
    }
    setConfirmError('');
    return true;
  };

  const handleSendCode = async () => {
    if (!validateEmail(email)) return;
    if (codeCountdown > 0) return;

    setSendingCode(true);
    try {
      await authApi.sendRegisterCode(email);
      setCodeCountdown(CODE_COUNTDOWN);
      toast.success('验证码已发送');
    } catch (err) {
      if (err instanceof ApiError) {
        const errorCode = err.code;
        if (errorCode === 'EMAIL_TAKEN (10007)') {
          setEmailError('该邮箱已被注册');
        } else if (errorCode === 'RATE_LIMITED (40001)') {
          toast.error('发送过于频繁，请稍后再试');
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('网络连接失败，请检查网络');
      }
    } finally {
      setSendingCode(false);
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    const validEmail = validateEmail(email);
    const validCode = validateCode(code);
    const validUsername = validateUsername(username);
    const validPassword = validatePassword(password);
    const validConfirm = validateConfirmPassword(confirmPassword, password);

    if (!validEmail || !validCode || !validUsername || !validPassword || !validConfirm) {
      const firstError = document.querySelector('.text-red-500');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!agreed) {
      setGlobalError('请阅读并同意用户协议');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({ email, code, username, password });
      toast.success('注册成功');
      navigate('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        const errorCcode = err.code;
        if (errorCcode === 'INVALID_VERIFY_CODE (10008)') {
          setCodeError('验证码错误或已过期');
        } else if (errorCcode === 'USERNAME_TAKEN (10006)') {
          setUsernameError('用户名已被占用');
        } else if (errorCcode === 'EMAIL_TAKEN (10007)') {
          setEmailError('该邮箱已被注册，请直接登录或使用找回密码');
        } else if (errorCcode === 'RATE_LIMITED (40001)') {
          setGlobalError('操作过于频繁，请稍后重试');
        } else {
          setGlobalError(err.message);
        }
      } else {
        toast.error('网络连接失败，请检查网络');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold text-foreground mb-8 text-center">注册</h1>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-card p-6">
        {globalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {globalError}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Email with send code button */}
          <div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="邮箱"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                  placeholder="example@email.com"
                  error={emailError}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div className="pt-7">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sendingCode || codeCountdown > 0 || !!emailError || !email}
                  onClick={handleSendCode}
                  className="whitespace-nowrap h-9"
                >
                  {sendingCode
                    ? '发送中...'
                    : codeCountdown > 0
                      ? `${codeCountdown}s`
                      : '发送验证码'}
                </Button>
              </div>
            </div>
          </div>

          <Input
            label="验证码"
            type="text"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(val);
              validateCode(val);
            }}
            placeholder="请输入6位数字验证码"
            error={codeError}
            disabled={loading}
            autoComplete="one-time-code"
            maxLength={6}
          />

          <div>
            <Input
              label="用户名"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="3-20 个字符，英文、数字和下划线"
              error={usernameError}
              disabled={loading}
              autoComplete="username"
            />
            {checkingUsername && (
              <p className="text-xs text-muted-foreground mt-1">检查中...</p>
            )}
            {!checkingUsername && usernameAvailable && !usernameError && (
              <p className="text-xs text-emerald-500 mt-1">用户名可用</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                label="密码"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                  if (confirmPassword) validateConfirmPassword(confirmPassword, e.target.value);
                }}
                placeholder="至少 8 位，包含大小写字母和数字"
                error={passwordError}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground/80 text-sm"
                tabIndex={-1}
              >
                {showPassword ? '隐藏' : '显示'}
              </button>
            </div>
            {password && !passwordError && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  <div className={`h-1 flex-1 rounded ${strength.level >= 1 ? strength.color : 'bg-muted'}`} />
                  <div className={`h-1 flex-1 rounded ${strength.level >= 2 ? strength.color : 'bg-muted'}`} />
                  <div className={`h-1 flex-1 rounded ${strength.level >= 3 ? strength.color : 'bg-muted'}`} />
                </div>
                <p className={`text-xs ${strength.level >= 3 ? 'text-emerald-500' : strength.level === 2 ? 'text-amber-500' : 'text-red-500'}`}>
                  密码强度：{strength.label}
                </p>
              </div>
            )}
          </div>

          <Input
            label="确认密码"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              validateConfirmPassword(e.target.value, password);
            }}
            placeholder="请再次输入密码"
            error={confirmError}
            disabled={loading}
            autoComplete="new-password"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground/80">
              我已阅读并同意用户协议和隐私政策
            </span>
          </label>

          <Button
            type="submit"
            disabled={loading || !agreed}
            size="lg"
            className="w-full mt-2"
          >
            {loading ? '注册中...' : '注册'}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          已有账号？
          <Link to="/login" className="text-primary hover:underline ml-1">
            登录
          </Link>
        </div>
      </form>
    </div>
  );
}
