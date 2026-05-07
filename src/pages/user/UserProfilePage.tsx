import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as userApi from '../../api/user';
import { getFolders, getFolderItems, type CollectionFolder, type CollectionItem } from '../../api/collection';
import { ApiError } from '../../utils/error';
import Avatar from '../../components/ui/Avatar';
import LevelBadge from '../../components/ui/LevelBadge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';
import CollectionList from '../../components/CollectionList';
import CollectionFolderManager from '../../components/CollectionFolderManager';
import { toast } from '../../components/ui/Toast';
import { formatRelativeTime } from '../../utils/relativeTime';

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  avatar: string | null;
  bio: string | null;
  level: number;
  points: number;
  postCount: number;
  replyCount: number;
  createdAt: string;
}

type TabKey = 'posts' | 'replies' | 'collections' | 'history';

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
  { key: 'posts', label: '我的帖子' },
  { key: 'replies', label: '我的回复' },
  { key: 'collections', label: '我的收藏', requiresAuth: true },
  { key: 'history', label: '浏览历史', requiresAuth: true },
];

const PAGE_SIZE = 20;

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = currentUser?.username === username;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [items, setItems] = useState<(PostItem | ReplyItem)[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tabLoading, setTabLoading] = useState(false);

  // Collection folder management
  const [managerOpen, setManagerOpen] = useState(false);
  const [folders, setFolders] = useState<CollectionFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);

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
      if (selectedFolderId === null) {
        // Show all — use existing userApi.getCollections
        const res = await userApi.getCollections(username!, page, PAGE_SIZE);
        setItems(res.items);
        setTotal(res.total);
      } else {
        const res = await getFolderItems(selectedFolderId, page - 1, PAGE_SIZE);
        if (res) {
          setCollectionItems(res.items);
          setTotal(res.total);
        } else {
          setCollectionError('收藏夹功能暂未开放');
        }
      }
    } catch {
      setCollectionError('加载失败');
    } finally {
      setCollectionLoading(false);
    }
  }, [username, selectedFolderId, page]);

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
    if (isOwner) fetchFolders();
  }, [fetchProfile]); // eslint-disable-line react-hooks/exhaustive-deps

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
          break;
        case 'collections':
          res = await userApi.getCollections(username, page, PAGE_SIZE);
          break;
        case 'history':
          res = await userApi.getBrowseHistory(page, PAGE_SIZE);
          break;
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

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(1);
  };

  // Profile skeleton
  if (profileLoading) {
    return (
      <div>
        <div className="bg-white rounded-lg shadow-card p-6 mb-6">
          <Skeleton variant="profile" />
        </div>
        <div className="bg-white rounded-lg shadow-card">
          <Skeleton variant="text" width="100%" height="40px" className="mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="post-card" className="mb-3" />
          ))}
        </div>
      </div>
    );
  }

  // Profile error
  if (profileError) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <ErrorState
          title={profileError}
          description={profileError === '加载失败' ? '请检查网络连接后重试' : ''}
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
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex items-start gap-6">
          <Avatar
            src={profile.avatar || undefined}
            name={profile.username}
            size={64}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{profile.username}</h1>
              <LevelBadge level={(profile.level || 1) as 1 | 2 | 3 | 4 | 5 | 6} />
            </div>
            {profile.bio && (
              <p className="text-sm text-gray-500 mb-3">{profile.bio}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>积分：{profile.points ?? 0}</span>
              <span>帖子：{profile.postCount ?? 0}</span>
              <span>回复：{profile.replyCount ?? 0}</span>
              <span>注册于：{formatRelativeTime(profile.createdAt)}</span>
            </div>
          </div>
          {isOwner && (
            <Link
              to="/settings"
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150"
            >
              编辑资料
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="flex items-center border-b border-gray-200">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-6 py-3 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'text-primary-500 border-primary-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {isOwner && activeTab === 'collections' && (
            <button
              onClick={() => setManagerOpen(true)}
              className="ml-auto mr-4 px-3 py-1.5 text-xs text-gray-500 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150"
            >
              管理收藏夹
            </button>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'collections' && folders.length > 0 ? (
            <CollectionList
              folders={folders}
              selectedFolderId={selectedFolderId}
              items={collectionItems}
              loading={collectionLoading}
              error={collectionError}
              onFolderChange={(id) => {
                setSelectedFolderId(id);
                setPage(1);
              }}
              onRetry={fetchCollectionItems}
            />
          ) : tabLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="post-card" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title={EMPTY_TITLES[activeTab]}
              description={EMPTY_DESCRIPTIONS[activeTab]}
              action={
                !isOwner ? (
                  <Link
                    to="/"
                    className="inline-block px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors duration-150"
                  >
                    去逛逛
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-card-hover transition-all duration-200">
                    {'title' in item ? (
                      <Link to={`/post/${item.id}`} className="block">
                        <h3 className="text-base font-medium text-gray-900 mb-2 line-clamp-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {item.boardName && <span>{item.boardName}</span>}
                          {item.replyCount !== undefined && <span>{item.replyCount} 回复</span>}
                          {item.likeCount !== undefined && <span>{item.likeCount} 点赞</span>}
                          <span>{formatRelativeTime(item.createdAt)}</span>
                        </div>
                      </Link>
                    ) : (
                      <div>
                        <Link to={`/post/${item.postId}`} className="block">
                          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                            {(item as ReplyItem).content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
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
              <Pagination
                current={page}
                total={total}
                pageSize={PAGE_SIZE}
                onChange={setPage}
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
