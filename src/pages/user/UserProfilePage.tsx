import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as userApi from '../../api/user';
import type { UserProfile } from '../../api/user';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { followUser, unfollowUser, checkFollowing } from '../../api/follow';
import {
  getFolders,
  getFavorites,
  moveItems,
  type CollectionFolder,
  type CollectionItem,
} from '../../api/collection';
import { ApiError } from '../../utils/error';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui';
import { LevelBadge } from '../../components/ui';
import { Skeleton } from '../../components/ui';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '../../components/ui';
import { ErrorEmpty, PaginationComponent } from '../../components/shared';
import CollectionList from '../../components/CollectionList';
import CollectionFolderManager from '../../components/CollectionFolderManager';
import BatchMoveBar from '../../components/BatchMoveBar';
import LevelProgress from '../../components/LevelProgress';
import PointsHistory from '../../components/PointsHistory';
import { toast } from '../../components/ui';
import { formatRelativeTime } from '../../utils/relativeTime';

type TabKey = 'posts' | 'replies' | 'collections' | 'history' | 'points';

interface TabItem {
  key: TabKey;
  label: string;
  requiresAuth?: boolean;
}

interface PostItem {
  id: number;
  title: string;
  boardName?: string;
  replyCount?: number;
  likeCount?: number;
  createdAt: string;
}

interface ReplyItem {
  id: number;
  content: string;
  postId: number;
  postTitle?: string;
  createdAt: string;
}

const TABS: TabItem[] = [
  { key: 'posts', label: '帖子' },
  { key: 'replies', label: '回复' },
  { key: 'collections', label: '收藏', requiresAuth: true },
  { key: 'history', label: '浏览历史', requiresAuth: true },
  { key: 'points', label: '积分记录', requiresAuth: true },
];

const PAGE_SIZE = 20;

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = currentUser?.username === username;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [items, setItems] = useState<(PostItem | ReplyItem)[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tabLoading, setTabLoading] = useState(false);

  // Collection folder management
  const [managerOpen, setManagerOpen] = useState(false);
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  // Batch move state
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState(false);

  const canManageFolders = isOwner && (profile?.level ?? 0) >= 3;

  const fetchFolders = useCallback(async () => {
    const data = await getFolders();
    if (data.length > 0) {
      setFolders(data);
    }
  }, []);

  const fetchCollectionItems = useCallback(async () => {
    setCollectionLoading(true);
    setCollectionError(null);
    try {
      const res = await getFavorites(page, PAGE_SIZE, selectedFolderId ?? undefined);
      if (res) {
        setCollectionItems(res.items);
        setTotal(res.total);
      } else {
        setCollectionError('收藏功能暂未开放');
      }
    } catch {
      setCollectionError('加载失败');
    } finally {
      setCollectionLoading(false);
    }
  }, [page, selectedFolderId]);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setProfileLoading(true);
    setProfileError('');
    try {
      const data = await userApi.getProfile(username);
      setProfile(data);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NOT_FOUND (30001)') {
        setProfileError('用户不存在');
      } else {
        setProfileError('加载失败');
      }
    } finally {
      setProfileLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Check follow status when viewing another user's profile
  useEffect(() => {
    if (!username || !currentUser || currentUser.username === username) return;
    checkFollowing(username)
      .then((data) => setIsFollowing(data.following))
      .catch(() => {/* ignore */});
  }, [username, currentUser]);

  useEffect(() => {
    if (isOwner) fetchFolders();
  }, [isOwner, fetchFolders]);

  const fetchTabData = useCallback(async () => {
    if (!username) return;
    setTabLoading(true);
    try {
      let res: { items: (PostItem | ReplyItem)[]; total: number };
      switch (activeTab) {
        case 'posts':
          res = await userApi.getUserPosts(username, page, PAGE_SIZE);
          break;
        case 'replies':
          res = await userApi.getUserReplies(username, page, PAGE_SIZE);
          res = {
            items: (res.items || []).map((item: any) => ({
              id: item.id,
              postId: item.postId,
              postTitle: item.postTitle || '(无标题)',
              content: item.contentSummary || '',
              createdAt: item.createdAt || '',
            })),
            total: res.total,
          };
          break;
        case 'collections':
          res = await userApi.getFavorites(username, page, PAGE_SIZE);
          res = {
            items: (res.items || []).map((item: any) => ({
              id: Number(item.postId) || 0,
              title: item.postTitle || '(无标题)',
              boardName: item.boardName || '',
              createdAt: item.collectedAt || '',
            })),
            total: res.total,
          };
          break;
        case 'history': {
          const historyRes = await userApi.getBrowseHistory(username!, page, PAGE_SIZE);
          res = {
            items: (historyRes.items || []).map((item: any) => ({
              id: item.postId,
              title: item.postTitle || '(无标题)',
              createdAt: item.viewedAt || '',
            })),
            total: historyRes.total,
          };
          break;
        }
        default:
          res = { items: [], total: 0 };
      }
      setItems(res.items);
      setTotal(res.total);
    } catch {
      toast.error('加载失败');
    } finally {
      setTabLoading(false);
    }
  }, [username, activeTab, page]);

  useEffect(() => {
    if (activeTab === 'collections' && folders.length > 0) {
      fetchCollectionItems();
    } else {
      fetchTabData();
    }
  }, [fetchTabData, fetchCollectionItems, activeTab, folders]);

  const handleToggleSelect = (postId: string) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleBatchMove = async (targetFolderId: string) => {
    if (selectedPostIds.size === 0 || moving) return;
    setMoving(true);
    const postIds = Array.from(selectedPostIds);
    const ok = await moveItems(postIds, targetFolderId);
    setMoving(false);
    if (ok) {
      // Remove moved items from current view
      setCollectionItems((prev) => prev.filter((item) => !selectedPostIds.has(item.postId)));
      setSelectedPostIds(new Set());
      toast.success(`已移动到收藏夹`);
      // Refresh folders to update counts
      fetchFolders();
    } else {
      toast.error('移动失败，请重试');
    }
  };

  const handleCancelSelection = () => {
    setSelectedPostIds(new Set());
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedPostIds(new Set());
  };

  // Profile skeleton
  if (profileLoading) {
    return (
      <div>
        <div className="bg-card rounded-lg shadow-card p-6 mb-6">
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
        <div className="bg-card rounded-lg shadow-card">
          <Skeleton className="h-4 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="mb-3" />
          ))}
        </div>
      </div>
    );
  }

  // Profile error
  if (profileError) {
    return (
      <div className="bg-card rounded-lg shadow-card p-6">
        <ErrorEmpty
          description={profileError === '加载失败' ? '请检查网络连接后重试' : undefined}
          onRetry={profileError === '加载失败' ? fetchProfile : undefined}
        />
      </div>
    );
  }

  if (!profile) return null;

  const visibleTabs = TABS.filter((t) => !t.requiresAuth || isOwner);

  return (
    <div>
      {/* User Info Card */}
      <div className="bg-card rounded-lg shadow-card p-6 mb-6">
        <div className="flex items-start gap-6">
          <Avatar size="lg">
            {profile.avatarUrl && <AvatarImage src={normalizeImageUrl(profile.avatarUrl)} alt={profile.username} />}
            <AvatarFallback>{profile.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{profile.username}</h1>
              <LevelBadge level={(profile.level || 1) as 1 | 2 | 3 | 4 | 5 | 6} />
            </div>
            {profile.signature && (
              <p className="text-sm text-muted-foreground mb-3">{profile.signature}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>积分：{profile.points ?? 0}</span>
              <span>关注 {profile.followingCount ?? 0}</span>
              <span>粉丝 {profile.followerCount ?? 0}</span>
              <span>注册于：{formatRelativeTime(profile.createdAt)}</span>
            </div>
            <LevelProgress points={profile.points ?? 0} className="mt-4" />
          </div>
          {isOwner && (
            <Link
              to="/settings"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/30 transition-colors duration-150"
            >
              编辑资料
            </Link>
          )}
          {!isOwner && currentUser && (
            <button
              onClick={async () => {
                if (followLoading) return;
                setFollowLoading(true);
                try {
                  if (isFollowing) {
                    await unfollowUser(username!);
                    setIsFollowing(false);
                    toast.success('已取消关注');
                  } else {
                    await followUser(username!);
                    setIsFollowing(true);
                    toast.success('关注成功');
                  }
                } catch {
                  toast.error('操作失败，请重试');
                } finally {
                  setFollowLoading(false);
                }
              }}
              disabled={followLoading}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                isFollowing
                  ? 'text-muted-foreground border border-border hover:bg-muted/30'
                  : 'text-primary-foreground bg-primary hover:bg-primary/90'
              }`}
            >
              {followLoading ? '...' : isFollowing ? '已关注' : '+ 关注'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-lg shadow-card">
        <div className="flex items-center border-b border-border">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-6 py-3 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {isOwner ? `我的${tab.label}` : `TA的${tab.label}`}
            </button>
          ))}
          {isOwner && activeTab === 'collections' && (
            <button
              onClick={() => setManagerOpen(true)}
              className="ml-auto mr-4 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded hover:bg-muted/30 transition-colors duration-150"
            >
              管理收藏夹
            </button>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'points' ? (
            <PointsHistory username={username!} />
          ) : activeTab === 'collections' && folders.length > 0 ? (
            <CollectionList
              folders={folders}
              selectedFolderId={selectedFolderId}
              items={collectionItems}
              loading={collectionLoading}
              error={collectionError}
              onFolderChange={(id) => {
                setSelectedFolderId(id);
                setPage(1);
                setSelectedPostIds(new Set());
              }}
              onRetry={fetchCollectionItems}
              selectable={canManageFolders}
              selectedIds={selectedPostIds}
              onToggleSelect={handleToggleSelect}
              onNewFolder={() => setManagerOpen(true)}
            />
          ) : tabLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{EMPTY_TITLES[activeTab]}</EmptyTitle>
                <EmptyDescription>{EMPTY_DESCRIPTIONS[activeTab]}</EmptyDescription>
              </EmptyHeader>
              {!isOwner ? (
                <EmptyContent>
                  <Link
                    to="/"
                    className="inline-block px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors duration-150"
                  >
                    去逛逛
                  </Link>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div key={item.id} className="p-4 border border-border rounded-lg hover:shadow-card-hover transition-all duration-200">
                    {'title' in item ? (
                      <Link to={`/post/${item.id}`} className="block">
                        <h3 className="text-base font-medium text-foreground mb-2 line-clamp-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {item.boardName && <span>{item.boardName}</span>}
                          {item.replyCount !== undefined && <span>{item.replyCount} 回复</span>}
                          {item.likeCount !== undefined && <span>{item.likeCount} 点赞</span>}
                          <span>{formatRelativeTime(item.createdAt)}</span>
                        </div>
                      </Link>
                    ) : (
                      <div>
                        <Link to={`/post/${item.postId}`} className="block">
                          <p className="text-sm text-foreground mb-2 line-clamp-2">
                            {(item as ReplyItem).content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {'postTitle' in item && (
                              <span>帖子：{item.postTitle}</span>
                            )}
                            <span>{formatRelativeTime(item.createdAt)}</span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <PaginationComponent
                currentPage={page}
                total={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      <CollectionFolderManager
        open={managerOpen}
        onClose={() => {
          setManagerOpen(false);
          fetchFolders();
        }}
      />

      {selectedPostIds.size > 0 && (
        <BatchMoveBar
          selectedCount={selectedPostIds.size}
          onMove={handleBatchMove}
          onCancel={handleCancelSelection}
        />
      )}
    </div>
  );
}

const EMPTY_TITLES: Record<TabKey, string> = {
  posts: '还没有发布过帖子',
  replies: '还没有回复过帖子',
  collections: '还没有收藏帖子',
  history: '还没有浏览记录',
};

const EMPTY_DESCRIPTIONS: Record<TabKey, string> = {
  posts: '去版块页面看看感兴趣的话题吧',
  replies: '参与讨论，让你的声音被听到',
  collections: '遇到好内容记得收藏哦',
  history: '浏览过的帖子会出现在这里',
};
