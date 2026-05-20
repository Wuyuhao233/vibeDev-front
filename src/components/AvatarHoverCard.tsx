import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui';
import LevelBadge from './ui/LevelBadge';
import { normalizeImageUrl } from '../utils/imageUrl';
import { getUserBrief } from '../api/follow';
import { followUser, unfollowUser, checkFollowing } from '../api/follow';
import { useAuthStore } from '../store/authStore';
import { toast } from './ui';

interface AvatarHoverCardProps {
  username: string;
  avatarUrl: string | null;
  nickname?: string;
  level?: number;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function AvatarHoverCard({
  username,
  avatarUrl,
  nickname,
  level,
  size = 'default',
  className = '',
  onClick,
  children,
}: AvatarHoverCardProps) {
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState<{
    nickname: string;
    signature: string | null;
    level: number;
    levelTitle: string;
    points: number;
  } | null>(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const isSelf = currentUser?.username === username;

  const fetchProfile = useCallback(async () => {
    if (profile || profileLoading) return;
    setProfileLoading(true);
    try {
      const data = await getUserBrief(username);
      setProfile({
        nickname: data.nickname,
        signature: data.signature,
        level: data.level,
        levelTitle: data.levelTitle,
        points: data.points,
      });
      // Check follow status for non-self users
      if (isAuthenticated && !isSelf) {
        try {
          const followData = await checkFollowing(username);
          setFollowing(followData.following);
        } catch {
          // ignore
        }
      }
    } catch {
      // silently fail
    } finally {
      setProfileLoading(false);
    }
  }, [username, profile, profileLoading, isAuthenticated, isSelf]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(true);
    fetchProfile();
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setShow(false), 200);
  };

  const handlePopoverEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handlePopoverLeave = () => {
    timerRef.current = setTimeout(() => setShow(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followLoading || !isAuthenticated || isSelf) return;
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(username);
        setFollowing(false);
        toast.success('已取消关注');
      } else {
        await followUser(username);
        setFollowing(true);
        toast.success('关注成功');
      }
    } catch {
      toast.error('操作失败，请稍后重试');
    } finally {
      setFollowLoading(false);
    }
  };

  const displayLevel = profile?.level || level || 1;
  const safeLevel = Math.min(Math.max(displayLevel, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div onClick={onClick} className="cursor-pointer">
        {children || (
          <Avatar size={size} className={className}>
            {avatarUrl && <AvatarImage src={normalizeImageUrl(avatarUrl)} alt={username} />}
            <AvatarFallback>{username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {show && (
        <div
          className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-card rounded-lg shadow-modal border border-border p-3 animate-fade-in"
          onMouseEnter={handlePopoverEnter}
          onMouseLeave={handlePopoverLeave}
        >
          {/* Header */}
          <div className="flex items-start gap-3">
            <Avatar size="lg">
              {avatarUrl && <AvatarImage src={normalizeImageUrl(avatarUrl)} alt={username} />}
              <AvatarFallback className="text-base">{username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground truncate">
                  {profile?.nickname || nickname || username}
                </span>
                <LevelBadge level={safeLevel} />
              </div>
              <span className="text-xs text-muted-foreground">@{username}</span>
            </div>
          </div>

          {/* Signature */}
          {profile?.signature && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {profile.signature}
            </p>
          )}

          {/* Stats */}
          {profile && (
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>Lv.{profile.level} {profile.levelTitle}</span>
              <span>·</span>
              <span>{profile.points} 积分</span>
            </div>
          )}

          {/* Follow button */}
          {isAuthenticated && !isSelf && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`w-full mt-3 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${
                following
                  ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {followLoading ? '...' : following ? '已关注' : '+ 关注'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
