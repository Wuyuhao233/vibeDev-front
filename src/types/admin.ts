// Admin dashboard
export interface DashboardStats {
  todayPosts: number;
  todayUsers: number;
  pendingAudits: number;
  pendingReports: number;
  onlineUsers: number;
  totalPosts: number;
  totalUsers: number;
  totalReplies: number;
  postsTrend: TrendItem[];
}

export interface TrendItem {
  date: string;
  count: number;
}

// User management
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: 'admin' | 'moderator' | 'user';
  level: number;
  points: number;
  isBanned: boolean;
  isActivated: boolean;
  postCount: number;
  replyCount: number;
  createdAt: string;
  lastLoginAt: string | null;
  bannedUntil: string | null;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  total: number;
}

// Post management
export interface AdminPost {
  id: string;
  title: string;
  authorId: string;
  boardId: string;
  isDeleted: boolean;
  deletedBy: string | null;
  auditStatus: string;
  isPinned: boolean;
  pinType: string;
  isEssence: boolean;
  likeCount: number;
  replyCount: number;
  collectCount: number;
  heatScore: number;
  createdAt: string;
  updatedAt: string;
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
  icon: string | null;
  description: string;
  postCount: number;
  sortOrder: number;
  status: 'active' | 'archived';
  tags?: AdminTag[];
}

export interface AdminTag {
  id: string;
  name: string;
  sortOrder: number;
  postCount: number;
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
