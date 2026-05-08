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
  id: string;
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
  id: string;
  title: string;
  author: { id: string; username: string; avatar: string | null };
  board: { id: string; name: string } | null;
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
  id: string;
  reporterId: string;
  targetType: 'post' | 'reply';
  targetId: string;
  reasonType: string;
  description: string | null;
  status: string;
  result: string | null;
  resultDescription: string | null;
  handlerId: string | null;
  isMalicious: boolean;
  createdAt: string;
  processedAt: string | null;
}

export interface AdminReportListResponse {
  items: AdminReport[];
  total: number;
}

// Board management
export interface AdminBoard {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  postCount: number;
  sortOrder: number;
  status: 'active' | 'archived';
}

export interface AdminTag {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

// Sensitive words
export interface SensitiveWord {
  id: string;
  word: string;
  matchType: string;
  isActive: boolean;
  createdBy: string;
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

// Review queue (V1.1)
export interface ReviewQueueItem {
  id: string;
  targetType: 'post' | 'reply';
  targetId: string;
  targetTitle: string;
  contentExcerpt: string;
  author: { id: string; username: string; avatarUrl: string | null };
  boardName: string;
  aiScore: number;
  aiCategory: string;
  aiDegraded: boolean;
  status: 'pending' | 'approved' | 'rejected';
  priority: number;
  createdAt: string;
}

export interface ReviewQueueStats {
  pendingCount: number;
  todayApproved: number;
  todayRejected: number;
}

export interface ReviewQueueListResponse {
  items: ReviewQueueItem[];
  stats: ReviewQueueStats;
  total: number;
  page: number;
  pageSize: number;
}

// Appeal (V1.2)
export interface AppealItem {
  id: string;
  contentId: string;
  contentTitle: string;
  contentSummary: string;
  appellantUsername: string;
  violationCategory: string;
  aiScore: number | null;
  appealReason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface AppealListResponse {
  items: AppealItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReviewStatsResponse {
  queue: {
    pendingCount: number;
    appealCount: number;
    todayApproved: number;
    todayRejected: number;
  };
  reports: {
    pendingCount: number;
    todayResolved: number;
  };
  quality: {
    passRate: number;
    blockRate: number;
    manualPassRate: number;
    falsePositiveRate: number;
    missRate: number;
  };
  cost: {
    monthlyBudget: number;
    monthlyCost: number;
    dailyApiCalls: number;
    isBudgetExceeded: boolean;
  };
}
