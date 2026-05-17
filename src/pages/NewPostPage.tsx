import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getBoards } from '../api/board';
import { createPost, checkSensitiveWords } from '../api/post';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import MarkdownSplitEditor from '../components/MarkdownSplitEditor';
import TagSelector from '../components/TagSelector';
import {
  Button,
  toast,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../components/ui';

export default function NewPostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const boardIdParam = searchParams.get('board');
  const { isAuthenticated, user, logout } = useAuthStore();

  // User menu
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/');
  };

  // Board data
  const storeBoards = useBoardStore((s) => s.boards);
  const boards = storeBoards.length > 0 ? storeBoards : [];

  useEffect(() => {
    if (storeBoards.length === 0) {
      getBoards().catch(() => {});
    }
  }, [storeBoards]);

  // Form state
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(
    boardIdParam || null,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  // UI state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sensitiveHits, setSensitiveHits] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sensitive word detection via server API (300ms debounce)
  useEffect(() => {
    if (!title && !content) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const combined = [title, content].filter(Boolean).join('\n');
        const result = await checkSensitiveWords(combined);
        if (result.hasSensitive) {
          setSensitiveHits([...new Set(result.matches.map((m) => m.word))]);
        } else {
          setSensitiveHits([]);
        }
      } catch {
        // Server validation on submit as safety net
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, content]);

  // Draft save (generic key, not board-specific)
  useEffect(() => {
    if (!title && !content) return;
    const timer = setTimeout(() => {
      const draft = {
        boardId: selectedBoardId,
        tags: selectedTags,
        title,
        content,
        coverImageUrl,
      };
      try {
        localStorage.setItem('vibeDev:draft:post:new', JSON.stringify(draft));
      } catch {
        // localStorage full, ignore
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [selectedBoardId, selectedTags, title, content, coverImageUrl]);

  // Load draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vibeDev:draft:post:new');
      if (raw) {
        const draft = JSON.parse(raw);
        if (!title && !content) {
          if (draft.boardId) setSelectedBoardId(draft.boardId);
          setSelectedTags(draft.tags || []);
          setTitle(draft.title || '');
          setContent(draft.content || '');
          setCoverImageUrl(draft.coverImageUrl || '');
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Warn on leave
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (title || content) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [title, content]);

  // Current board data
  const currentBoard = useMemo(
    () => boards.find((b) => b.id === selectedBoardId),
    [boards, selectedBoardId],
  );

  const availableTags = useMemo(
    () => currentBoard?.tags?.map((t) => ({ id: t.id, name: t.name })) || [],
    [currentBoard],
  );

  // Validation
  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedBoardId) errs.board = '请选择版块';
    if (selectedTags.length < 1) errs.tags = '请至少选择一个标签';
    if (title.length < 5) errs.title = '标题长度需在 5-100 字符之间';
    if (title.length > 100) errs.title = '标题长度需在 5-100 字符之间';
    if (!content.trim()) errs.content = '请输入帖子内容';
    if (sensitiveHits.length > 0) errs.sensitive = '内容包含敏感词';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [selectedBoardId, selectedTags, title, content, sensitiveHits]);

  // Publish
  const handlePublish = useCallback(async () => {
    if (!validate()) {
      const firstError = Object.values(errors)[0];
      if (firstError) toast.error(firstError);
      return;
    }

    setPublishing(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const post = await createPost({
        boardId: selectedBoardId!,
        title: title.trim(),
        content: content.trim(),
        tagIds: selectedTags,
        coverImageUrl: coverImageUrl || undefined,
        idempotencyKey,
      });
      localStorage.removeItem('vibeDev:draft:post:new');
      setShowPublishDialog(false);
      toast.success('发布成功！');
      setTimeout(() => navigate(`/post/${post.id}`, { replace: true }), 500);
    } catch (err: any) {
      const msg = err?.message || '发布失败，请稍后重试';
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  }, [validate, selectedBoardId, title, content, selectedTags, coverImageUrl, navigate, errors]);

  // Title character count color
  const titleCountColor =
    title.length === 0 || (title.length >= 5 && title.length <= 100)
      ? 'text-muted-foreground'
      : 'text-red-500';

  // No auth
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">请先登录后再发帖</p>
        </div>
      </div>
    );
  }

  return (
    <div className="new-post-editor flex flex-col">
      {/* Title row: title + publish button */}
      <div className="flex-shrink-0 px-8 pt-6 pb-3">
        <div className="max-w-[960px] mx-auto flex items-start gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题..."
              maxLength={100}
              className={`w-full text-3xl font-bold border-none outline-none bg-transparent text-foreground placeholder:text-muted-foreground py-2 ${
                errors.title ? 'text-red-500' : ''
              }`}
            />
            <span className={`absolute right-0 -bottom-1 text-sm ${titleCountColor}`}>
              {title.length}/100
            </span>
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 mt-2">
            <Button
              size="lg"
              disabled={publishing || sensitiveHits.length > 0}
              onClick={() => setShowPublishDialog(true)}
            >
              {sensitiveHits.length > 0 ? '内容包含违规词汇' : '发布'}
            </Button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-md hover:bg-muted transition-colors duration-150"
              >
                <Avatar size="sm">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user?.username || ''} />}
                  <AvatarFallback>{user?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`text-muted-foreground transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-lg shadow-modal border border-border py-1 z-dropdown">
                  <Link
                    to={`/u/${user?.username}`}
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150"
                  >
                    个人中心
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150"
                  >
                    设置
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'moderator') && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150"
                    >
                      管理后台
                    </Link>
                  )}
                  <hr className="border-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors duration-150"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 px-8">
        <div className="max-w-[960px] mx-auto h-full">
          <MarkdownSplitEditor
            value={content}
            onChange={setContent}
            placeholder="请输入文章内容，支持 Markdown 语法"
          />
        </div>
      </div>

      {/* Sensitive word warning */}
      {sensitiveHits.length > 0 && (
        <div className="px-8 pb-3">
          <div className="max-w-[960px] mx-auto flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-500 font-medium text-sm">!</span>
            <span className="text-sm text-red-600">内容包含敏感词：</span>
            {sensitiveHits.map((word) => (
              <span key={word} className="px-1.5 py-px text-xs bg-red-100 text-red-600 rounded">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Publish dialog */}
      <Dialog open={showPublishDialog} onOpenChange={(v) => !v && setShowPublishDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发布文章</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Board selector */}
            <div>
              <label className="block text-sm text-foreground mb-1">选择版块</label>
              <select
                value={selectedBoardId || ''}
                onChange={(e) => {
                  setSelectedBoardId(e.target.value || null);
                  setSelectedTags([]);
                }}
                className={`h-9 w-full px-3 border rounded-md text-sm bg-card outline-none ${
                  errors.board ? 'border-red-500' : 'border-border'
                }`}
              >
                <option value="">请选择版块</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.board && <p className="mt-1 text-xs text-red-500">{errors.board}</p>}
            </div>

            {/* Tag selector */}
            {currentBoard && (
              <div>
                <label className="block text-sm text-foreground mb-1">选择标签（1-3个）</label>
                <TagSelector
                  tags={availableTags}
                  selected={selectedTags}
                  onChange={setSelectedTags}
                  max={3}
                  min={1}
                  error={errors.tags}
                />
              </div>
            )}

            {/* Cover image URL */}
            <div>
              <label className="block text-sm text-foreground mb-1">封面图 URL（可选）</label>
              <input
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              取消
            </Button>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? '发布中...' : '确认发布'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
