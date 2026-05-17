import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import * as pointsApi from '../api/points';
import { ApiError } from '../utils/error';
import { toast } from './ui';

function getTodayKey() {
  return `vibeDev:checkin:${new Date().toISOString().slice(0, 10)}`;
}

function hasCheckedInToday(): boolean {
  try {
    return sessionStorage.getItem(getTodayKey()) === 'true';
  } catch {
    return false;
  }
}

function markCheckedInToday() {
  try {
    sessionStorage.setItem(getTodayKey(), 'true');
  } catch { /* storage full */ }
}

export default function CheckInButton() {
  const { isAuthenticated, user } = useAuthStore();
  const [checkedIn, setCheckedIn] = useState(hasCheckedInToday);
  const [loading, setLoading] = useState(false);

  const handleCheckIn = useCallback(async () => {
    if (!user || checkedIn || loading) return;
    setLoading(true);
    try {
      const result = await pointsApi.signIn(user.username);
      markCheckedInToday();
      setCheckedIn(true);

      const bonusMsg = result.consecutiveDays >= 7
        ? ` 连续签到 ${result.consecutiveDays} 天，额外奖励已发放！`
        : ` 已连续签到 ${result.consecutiveDays} 天`;

      toast.success(`签到成功！获得 ${result.pointsAwarded} 积分。${bonusMsg}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || '签到失败，请重试');
      } else {
        toast.error('签到失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  }, [user, checkedIn, loading]);

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={handleCheckIn}
      disabled={checkedIn || loading}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors duration-150 ${
        checkedIn
          ? 'text-muted-foreground cursor-default'
          : 'text-amber-500 hover:bg-amber-50 active:bg-amber-100'
      }`}
      title={checkedIn ? '今日已签到' : '签到领积分'}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span>{checkedIn ? '已签到' : '签到'}</span>
    </button>
  );
}
