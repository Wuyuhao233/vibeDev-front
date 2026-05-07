import client from './client';

export interface SignInResult {
  points: number;
  consecutiveDays: number;
}

export async function signIn(username: string) {
  const res = await client.post<{ data: SignInResult }>(`/v1/users/${username}/sign-in`);
  return res.data.data;
}

export interface PointsRecord {
  id: number;
  description: string;
  points: number;
  createdAt: string;
}

export async function getPointsHistory(username: string, page: number, limit: number) {
  const res = await client.get<{ data: { items: PointsRecord[]; total: number } }>(
    `/v1/users/${username}/points?page=${page}&limit=${limit}`,
  );
  return res.data.data;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  avatar: string | null;
  points: number;
}

export interface LeaderboardData {
  items: LeaderboardEntry[];
  total: number;
  currentUser: { rank: number; points: number } | null;
}

export async function getLeaderboard(period: 'weekly' | 'monthly' | 'all', page: number, limit: number) {
  const res = await client.get<{ data: LeaderboardData }>(
    `/v1/leaderboard?period=${period}&page=${page}&limit=${limit}`,
  );
  return res.data.data;
}
