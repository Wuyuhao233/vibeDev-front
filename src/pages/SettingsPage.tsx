import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import * as userApi from '../api/user';
import { ApiError } from '../utils/error';
import { PASSWORD_PATTERN } from '../utils/patterns';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Skeleton from '../components/ui/Skeleton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { toast } from '../components/ui/Toast';
import { formatRelativeTime } from '../utils/relativeTime';
import * as notificationApi from '../api/notification';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'data';

interface SettingsTabItem {
  key: SettingsTab;
  label: string;
}

const SETTINGS_TABS: SettingsTabItem[] = [
  { key: 'profile', label: '个人信息' },
  { key: 'security', label: '安全设置' },
  { key: 'notifications', label: '通知设置' },
  { key: 'data', label: '数据管理' },
];

export default function SettingsPage() {
  const [searchParams] = useSearchParams();

  const getInitialTab = (): SettingsTab => {
    const tab = searchParams.get('tab');
    if (tab === 'security' || tab === 'notifications' || tab === 'data') {
      return tab;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(getInitialTab);

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <nav className="w-48 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">设置</h1>
        <div className="flex flex-col gap-1">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-md text-left transition-colors duration-150 ${
                activeTab === tab.key
                  ? 'bg-primary-50 text-primary-500'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeTab === 'profile' && <ProfileSection />}
        {activeTab === 'security' && <SecuritySection />}
        {activeTab === 'notifications' && <NotificationSection />}
        {activeTab === 'data' && <DataSection />}
      </div>
    </div>
  );
}

/* ========== Profile Section ========== */

function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nickname, setNickname] = useState('');
  const [signature, setSignature] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [sigError, setSigError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await userApi.getMyProfile();
        setProfile(data);
        setNickname(data.username || '');
        setSignature(data.bio || '');
      } catch {
        toast.error('加载个人资料失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('不支持的图片格式，仅支持 JPG/PNG/GIF/WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片过大，请选择 5MB 以内的文件');
      return;
    }

    try {
      const { url } = await userApi.uploadAvatar(file);
      await userApi.updateProfile({ avatar: url, bio: undefined } as any);
      if (profile) setProfile({ ...profile, avatar: url });
      if (user) login({ ...user, avatar: url }, useAuthStore.getState().accessToken!, useAuthStore.getState().refreshToken!);
      toast.success('头像更新成功');
    } catch {
      toast.error('上传失败，请稍后重试');
    }
  };

  const handleSaveProfile = async () => {
    setNicknameError('');
    setSigError('');

    if (nickname.trim().length < 2) {
      setNicknameError('昵称需 2-20 个字符');
      return;
    }
    if (signature.length > 200) {
      setSigError('签名最多 200 个字符');
      return;
    }

    setSaving(true);
    try {
      await userApi.updateProfile({ bio: signature } as any);
      toast.success('个人信息已更新');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('保存失败，请稍后重试');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <Skeleton variant="profile" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">个人信息</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar
          src={profile?.avatar}
          name={profile?.username || ''}
          size={64}
        />
        <label className="px-4 py-2 text-sm font-medium text-primary-500 border border-primary-500 rounded-md hover:bg-primary-50 cursor-pointer transition-colors duration-150">
          更换头像
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 max-w-md">
        <Input
          label="昵称"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setNicknameError('');
          }}
          error={nicknameError}
          charCount={{ current: nickname.length, max: 20 }}
        />

        <Input
          label="签名"
          as="textarea"
          value={signature}
          onChange={(e) => {
            setSignature(e.target.value);
            setSigError('');
          }}
          error={sigError}
          charCount={{ current: signature.length, max: 200 }}
          rows={3}
        />

        <Button onClick={handleSaveProfile} loading={saving} className="self-start">
          保存修改
        </Button>
      </div>
    </div>
  );
}

/* ========== Security Section ========== */

function SecuritySection() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [newPwdError, setNewPwdError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // CAS binding
  const [casInfo, setCasInfo] = useState<userApi.CasBindingInfo | null>(null);
  const [casLoading, setCasLoading] = useState(false);
  const [unbindDialogOpen, setUnbindDialogOpen] = useState(false);
  const [unbinding, setUnbinding] = useState(false);

  // Handle CAS bind callback (code param)
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;

    setCasLoading(true);
    (async () => {
      try {
        const redirectUri = window.location.origin + '/settings';
        await userApi.bindCas(code, redirectUri);
        toast.success('CAS 账号绑定成功');
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('code');
        setSearchParams(newParams, { replace: true });
        await fetchCasBinding();
      } catch (err) {
        setCasLoading(false);
        if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error('CAS 绑定失败，请稍后重试');
        }
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('code');
        setSearchParams(newParams, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    fetchCasBinding();
  }, []);

  const fetchCasBinding = async () => {
    try {
      const data = await userApi.getCasBinding();
      setCasInfo(data);
    } catch {
      // Silently fail
    } finally {
      setCasLoading(false);
    }
  };

  const handleCasBind = () => {
    const redirectUri = window.location.origin + '/settings';
    window.location.href = `/api/v1/auth/cas/authorize?redirect=${encodeURIComponent(redirectUri)}`;
  };

  const handleUnbindCas = async () => {
    setUnbinding(true);
    try {
      await userApi.unbindCas();
      toast.success('CAS 账号已解绑');
      setCasInfo(null);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('解绑失败，请稍后重试');
      }
    } finally {
      setUnbinding(false);
      setUnbindDialogOpen(false);
    }
  };

  // Login history
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchLoginHistory();
  }, [historyPage]);

  const fetchLoginHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await userApi.getLoginHistory(historyPage, 20);
      setLoginHistory(res.items || []);
      setHistoryTotal(res.total || 0);
    } catch {
      // Silently fail
    } finally {
      setHistoryLoading(false);
    }
  };

  const validateNewPassword = (value: string) => {
    if (value.length < 8) {
      setNewPwdError('密码至少 8 位');
      return false;
    }
    if (!PASSWORD_PATTERN.test(value)) {
      setNewPwdError('密码需包含大小写字母和数字');
      return false;
    }
    setNewPwdError('');
    return true;
  };

  const handleChangePassword = async () => {
    setPwdError('');
    setNewPwdError('');
    setConfirmError('');

    if (!oldPassword) {
      setPwdError('请输入当前密码');
      return;
    }
    if (!validateNewPassword(newPassword)) return;
    if (newPassword === oldPassword) {
      setNewPwdError('新密码不能与当前密码相同');
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError('两次输入的密码不一致');
      return;
    }

    setSavingPwd(true);
    try {
      await userApi.changePassword(oldPassword, newPassword);
      setPwdSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'PASSWORD_WRONG (10005)') {
          setPwdError('当前密码不正确');
          setOldPassword('');
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('修改失败，请稍后重试');
      }
    } finally {
      setSavingPwd(false);
    }
  };

  const handleReLogin = async () => {
    await logout();
    navigate('/login?reason=password_changed');
  };

  if (pwdSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6 text-center">
        <div className="mb-4 text-5xl text-emerald-500">✓</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">密码修改成功</h2>
        <p className="text-sm text-gray-500 mb-6">
          为保障账号安全，请使用新密码重新登录
        </p>
        <Button variant="danger" onClick={handleReLogin}>
          重新登录
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Change Password */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">修改密码</h2>
        <div className="flex flex-col gap-4 max-w-md">
          <div className="relative">
            <Input
              label="当前密码"
              type={showOld ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => { setOldPassword(e.target.value); setPwdError(''); }}
              placeholder="请输入当前密码"
              error={pwdError}
              disabled={savingPwd}
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 text-sm"
              tabIndex={-1}
            >
              {showOld ? '隐藏' : '显示'}
            </button>
          </div>

          <div className="relative">
            <Input
              label="新密码"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                validateNewPassword(e.target.value);
                if (confirmPassword && e.target.value !== confirmPassword) {
                  setConfirmError('两次输入的密码不一致');
                } else {
                  setConfirmError('');
                }
              }}
              placeholder="至少 8 位，包含大小写字母和数字"
              error={newPwdError}
              disabled={savingPwd}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 text-sm"
              tabIndex={-1}
            >
              {showNew ? '隐藏' : '显示'}
            </button>
          </div>

          <Input
            label="确认新密码"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (e.target.value !== newPassword) {
                setConfirmError('两次输入的密码不一致');
              } else {
                setConfirmError('');
              }
            }}
            placeholder="请再次输入新密码"
            error={confirmError}
            disabled={savingPwd}
          />

          <Button onClick={handleChangePassword} loading={savingPwd} className="self-start">
            保存修改
          </Button>
        </div>
      </div>

      {/* CAS Binding */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">CAS 账号绑定</h2>

        {casInfo === null && casLoading && (
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="inline-block animate-spin-slow w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
            加载中...
          </div>
        )}

        {casInfo?.is_bound && (
          <div>
            <p className="text-sm text-gray-700 mb-1">
              已绑定 CAS 账号：<span className="font-medium text-gray-900">{casInfo.cas_username}</span>
            </p>
            {casInfo.bound_at && (
              <p className="text-sm text-gray-500 mb-4">
                绑定时间：{formatRelativeTime(casInfo.bound_at)}
              </p>
            )}
            <button
              onClick={() => setUnbindDialogOpen(true)}
              className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors duration-150"
            >
              解绑
            </button>
          </div>
        )}

        {casInfo && !casInfo.is_bound && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              绑定 CAS 账号后，可使用 CAS 单点登录
            </p>
            <Button variant="secondary" onClick={handleCasBind}>
              绑定 CAS 账号
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={unbindDialogOpen}
        onClose={() => setUnbindDialogOpen(false)}
        onConfirm={handleUnbindCas}
        title="确认解绑 CAS"
        description={
          <p>解绑后你将无法使用 CAS 登录，仅能通过邮箱密码登录。<br />请确认你已设置过密码。</p>
        }
        confirmLabel="确认解绑"
        loading={unbinding}
      />

      {/* Login History */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          登录历史 {historyTotal > 0 && <span className="text-sm font-normal text-gray-400">共 {historyTotal} 条</span>}
        </h2>

        {historyLoading ? (
          <Skeleton variant="table-row" rows={5} />
        ) : loginHistory.length === 0 ? (
          <EmptyState title="暂无登录记录" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 font-medium">时间</th>
                    <th className="pb-3 font-medium">登录方式</th>
                    <th className="pb-3 font-medium">IP</th>
                    <th className="pb-3 font-medium">设备</th>
                    <th className="pb-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map((entry, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 text-gray-700">{entry.createdAt ? formatRelativeTime(entry.createdAt) : '-'}</td>
                      <td className="py-3">{entry.method === 'cas' ? '🏷 CAS' : '📧 邮箱'}</td>
                      <td className="py-3 text-gray-500">{entry.ip || '-'}</td>
                      <td className="py-3 text-gray-500">{entry.userAgent || '-'}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 text-xs ${entry.success !== false ? 'text-emerald-500' : 'text-red-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${entry.success !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {entry.success !== false ? '成功' : '失败'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              current={historyPage}
              total={historyTotal}
              pageSize={20}
              onChange={setHistoryPage}
            />
          </>
        )}
      </div>

      {/* Deactivate Account */}
      <DeactivateSection />
    </div>
  );
}

/* ========== Deactivate Section ========== */

function DeactivateSection() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [understood, setUnderstood] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleClose = () => {
    setShowDialog(false);
    setStep(1);
    setUnderstood(false);
    setEmail('');
    setPassword('');
  };

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await userApi.deactivateAccount(password);
      setShowDialog(false);
      // Show result and logout
      await logout();
      navigate('/');
      toast.info('账号已注销');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'PASSWORD_WRONG (10005)') {
        toast.error('密码不正确');
        setPassword('');
      } else {
        toast.error('注销失败，请稍后重试');
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">账号注销</h2>
        <p className="text-sm text-gray-500 mb-4">
          注销后 30 天内可恢复账号，超过 30 天后数据彻底删除
        </p>
        <button
          onClick={() => setShowDialog(true)}
          className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors duration-150"
        >
          注销账号
        </button>
      </div>

      <Modal open={showDialog} onClose={handleClose} size="sm" closeOnBackdrop={false}>
        {step === 1 && (
          <>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-red-500 font-bold">!</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">注销账号</h3>
                <div className="mt-3 space-y-2 text-sm text-gray-500">
                  <p>注销后，以下操作不可撤销：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>个人信息将被清除（用户名、邮箱、头像、签名）</li>
                    <li>你的帖子、回复将保留，但作者名显示为「已注销用户」</li>
                    <li>你的收藏、浏览历史将被删除</li>
                    <li>注销后 30 天内可恢复账号，超过 30 天后数据彻底删除</li>
                  </ul>
                </div>
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={understood}
                    onChange={(e) => setUnderstood(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">我已了解注销账号的后果</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={handleClose}>取消</Button>
              <Button variant="danger" disabled={!understood} onClick={() => setStep(2)}>继续</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-red-500 font-bold">!</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">确认注销</h3>
                <p className="mt-2 text-sm text-gray-500">
                  你确定要注销账号吗？此操作不可撤销（30 天内可恢复）。
                </p>
                <div className="mt-4">
                  <Input
                    label="请输入你的注册邮箱进行确认"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setStep(1)}>上一步</Button>
              <Button
                variant="danger"
                disabled={email !== user?.email}
                onClick={() => setStep(3)}
              >
                确认注销
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-red-500">🔐</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">身份验证</h3>
                <p className="mt-2 text-sm text-gray-500">请输入当前登录密码以确认操作</p>
                <div className="mt-4">
                  <Input
                    label="密码"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setStep(2)}>上一步</Button>
              <Button
                variant="danger"
                disabled={!password}
                loading={loading}
                onClick={handleDeactivate}
              >
                确认注销账号
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

/* ========== Data Section ========== */

function DataSection() {
  const [scope, setScope] = useState('all');
  const [status, setStatus] = useState<'idle' | 'processing' | 'ready' | 'expired' | 'error'>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await userApi.exportData(scope);
      if (res.status === 'processing') {
        setTaskId(res.taskId);
        setStatus('processing');
        startPolling(res.taskId);
      } else if (res.status === 'ready') {
        setTaskId(res.taskId);
        setFileInfo(res);
        setStatus('ready');
      }
    } catch {
      toast.error('导出请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (id: string) => {
    let count = 0;
    pollRef.current = setInterval(async () => {
      count++;
      try {
        const res = await userApi.getExportStatus(id);
        if (res.status === 'ready') {
          clearInterval(pollRef.current);
          setFileInfo(res);
          setStatus('ready');
        } else if (res.status === 'error') {
          clearInterval(pollRef.current);
          setStatus('error');
        } else if (count >= 120) {
          clearInterval(pollRef.current);
          toast.warning('导出超时，请稍后查看');
          setStatus('idle');
        }
      } catch {
        // continue polling
      }
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleDownload = () => {
    if (taskId) {
      window.open(`/api/users/me/export-data/${taskId}/download`, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">数据导出</h2>

      {status === 'idle' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            你可以申请导出个人数据，包括帖子、回复、收藏和浏览次数。
            导出格式为 JSON，导出完成后可下载。
          </p>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-gray-700">导出范围：</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="all">全部数据</option>
              <option value="posts">仅帖子</option>
              <option value="replies">仅回复</option>
              <option value="collections">仅收藏</option>
            </select>
          </div>
          <Button onClick={handleExport} loading={loading}>
            申请导出
          </Button>
        </div>
      )}

      {status === 'processing' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin-slow w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
            <span className="text-sm text-gray-700">正在生成导出文件...</span>
          </div>
          <p className="text-sm text-gray-400">
            文件准备好后，你将在此页面看到下载按钮。
            你也可以关闭页面，稍后回到此页面查看。
          </p>
        </div>
      )}

      {status === 'ready' && (
        <div>
          <div className="mb-4 text-2xl text-emerald-500">✓</div>
          <p className="text-sm text-gray-700 mb-2">导出文件已生成</p>
          {fileInfo && (
            <p className="text-sm text-gray-500 mb-4">
              {fileInfo.size && `大小: ${fileInfo.size}`}
              {fileInfo.itemCounts && ` · 包含: 帖子 (${fileInfo.itemCounts.posts}), 回复 (${fileInfo.itemCounts.replies}), 收藏 (${fileInfo.itemCounts.collections})`}
            </p>
          )}
          <Button onClick={handleDownload}>下载文件</Button>
        </div>
      )}

      {status === 'expired' && (
        <div>
          <div className="mb-4 text-2xl text-amber-500">⚠</div>
          <p className="text-sm text-gray-700 mb-2">导出文件已过期</p>
          <p className="text-sm text-gray-500 mb-4">下载链接已过期，你可以重新申请导出。</p>
          <Button onClick={() => setStatus('idle')}>重新申请导出</Button>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="mb-4 text-2xl text-red-500">✕</div>
          <p className="text-sm text-gray-700 mb-2">导出失败</p>
          <p className="text-sm text-gray-500 mb-4">导出过程中发生错误，请稍后重试。</p>
          <Button onClick={() => setStatus('idle')}>重新申请导出</Button>
        </div>
      )}
    </div>
  );
}

/* ========== Notification Section ========== */

const EVENT_LABELS: Record<string, string> = {
  reply: '帖子被回复',
  like: '获得点赞',
  collect: '帖子被收藏',
  system: '系统通知',
  mention: '被 @提及',
  follow: '有人关注',
  user_banned: '账号状态变更',
};

const CHANNELS = [
  { key: 'site', label: '站内通知' },
  { key: 'email', label: '邮件通知' },
] as const;

function NotificationSection() {
  const [preferences, setPreferences] = useState<notificationApi.NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await notificationApi.getNotificationPreferences();
        setPreferences(data);
      } catch {
        toast.error('加载通知设置失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = async (eventType: string, channel: 'site' | 'email', enabled: boolean) => {
    const key = `${eventType}-${channel}`;
    setUpdating(key);
    try {
      await notificationApi.updateNotificationPreference(eventType, channel, enabled);
      setPreferences((prev) =>
        prev.map((p) =>
          p.eventType === eventType ? { ...p, [channel]: enabled } : p,
        ),
      );
    } catch {
      toast.error('更新失败，请稍后重试');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <Skeleton variant="table-row" rows={7} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">通知设置</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-3 font-medium">事件</th>
              {CHANNELS.map((ch) => (
                <th key={ch.key} className="pb-3 font-medium text-center w-28">
                  {ch.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preferences.map((pref) => {
              const isBanned = pref.eventType === 'user_banned';
              return (
                <tr
                  key={pref.eventType}
                  className={`border-b border-gray-100 ${isBanned ? 'bg-gray-50 text-gray-400' : ''}`}
                >
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2">
                      {isBanned && (
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      )}
                      {EVENT_LABELS[pref.eventType] || pref.eventType}
                    </span>
                  </td>
                  {CHANNELS.map((ch) => (
                    <td key={ch.key} className="py-3 text-center">
                      <label className={`inline-flex items-center cursor-pointer ${isBanned ? 'cursor-not-allowed' : ''}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={!!pref[ch.key as keyof typeof pref]}
                          disabled={isBanned || updating === `${pref.eventType}-${ch.key}`}
                          onChange={(e) =>
                            handleToggle(pref.eventType, ch.key, e.target.checked)
                          }
                        />
                        <span
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                            isBanned
                              ? 'bg-gray-200'
                              : pref[ch.key as keyof typeof pref]
                                ? 'bg-primary-500'
                                : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                              pref[ch.key as keyof typeof pref] ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </span>
                      </label>
                      {updating === `${pref.eventType}-${ch.key}` && (
                        <LoadingSpinner size="sm" className="ml-1 inline-block align-middle" />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {preferences.length === 0 && (
        <EmptyState title="暂无通知设置数据" />
      )}
    </div>
  );
}
