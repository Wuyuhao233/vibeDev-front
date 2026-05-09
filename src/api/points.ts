import client from './client';

export interface SignInResult {
  pointsAwarded: number;
  totalPoints: number;
  consecutiveDays: number;
  streakBonus: number;
}

export async function signIn(username: string) {
  const res = await client.post<{ data: SignInResult }>(`/users/${username}/sign-in`);
  return res.data.data;
}

export interface CheckinStatus {
  hasCheckedInToday: boolean;
  consecutiveDays: number;
  todayPoints: number | null;
}

export async function getCheckinStatus(username: string) {
  const res = await client.get<{ data: CheckinStatus }>(`/users/${username}/sign-in/status`);
  return res.data.data;
}

export interface PointsRecord {
  id: string;
  amount: number;
  reason: string;
  reasonLabel: string;
  relatedType?: string;
  relatedId?: string;
  relatedTitle?: string;
  createdAt: string;
}

export interface PointsLogData {
  items: PointsRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getPointsHistory(username: string, page: number, limit: number) {
  const res = await client.get<{ data: PointsLogData }>(
    `/users/${username}/points-log?page=${page}&limit=${limit}`,
  );
  return res.data.data;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  nickname: string;
  avatarUrl: string;
  points: number;
  level: number;
  levelTitle: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  period: string;
}

export async function getLeaderboard(period: 'week' | 'month' | 'all', limit: number) {
  const res = await client.get<{ data: LeaderboardData }>(
    `/users/leaderboard?period=${period}&limit=${limit}`,
  );
  return res.data.data;
}
