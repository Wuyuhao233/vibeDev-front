// Admin dashboard
export interface DashboardStats {
  todayNewUsers: number;
  todayNewPosts: number;
  todayNewReplies: number;
  totalUsers: number;
  totalPosts: number;
  totalReplies: number;
  pendingReports: number;
}

export interface TrendItem {
  date: string;
  users: number;
  posts: number;
  replies: number;
}

// User management
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  role: 'admin' | 'moderator' | 'user';
  level: number;
  points: number;
  status: 'active' | 'banned' | 'muted';
  bannedUntil: string | null;
  createdAt: string;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  total: number;
}

// Post management
export interface AdminPost {
  id: number;
  title: string;
  author: { id: number; username: string; avatar: string | null };
  board: { id: number; name: string } | null;
  status: 'published' | 'deleted' | 'hidden';
  isPinned: boolean;
  isEssence: boolean;
  createdAt: string;
}

export interface AdminPostListResponse {
  items: AdminPost[];
  total: number;
}

// Report management
export interface AdminReport {
  id: number;
  type: 'post' | 'reply';
  targetId: number;
  reason: string;
  description: string;
  reporter: { id: number; username: string };
  targetContent: string;
  status: 'pending' | 'handled';
  boardId: number | null;
  boardName: string | null;
  createdAt: string;
}

export interface AdminReportListResponse {
  items: AdminReport[];
  total: number;
}

// Board management
export interface AdminBoard {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  postCount: number;
  sortOrder: number;
  status: 'active' | 'archived';
}

export interface AdminTag {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

// Sensitive words
export interface SensitiveWord {
  id: number;
  word: string;
  category: string;
  enabled: boolean;
  createdAt: string;
}

export interface SensitiveWordListResponse {
  items: SensitiveWord[];
  total: number;
}

// System settings
export interface SettingItem {
  key: string;
  value: string;
  description: string;
}

export interface SettingListResponse {
  items: SettingItem[];
  total: number;
}
