import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getBoards, type Board } from '../api/board';
import { createPost, getSensitiveWords } from '../api/post';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import MarkdownSplitEditor from '../components/MarkdownSplitEditor';
import TagSelector from '../components/TagSelector';
import ImageUploader from '../components/ImageUploader';

let sensitiveWordsCache: string[] | null = null;
let sensitiveWordsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadSensitiveWords(): Promise<string[]> {
  const now = Date.now();
  if (sensitiveWordsCache && now - sensitiveWordsCacheTime < CACHE_TTL) {
    return sensitiveWordsCache;
  }
  try {
    const words = await getSensitiveWords();
    sensitiveWordsCache = words;
    sensitiveWordsCacheTime = now;
    return words;
  } catch {
    // If API fails, use empty list (server will validate on submit)
    return sensitiveWordsCache || [];
  }
}

function checkSensitive(words: string[], text: string): string[] {
  return words.filter((w) => text.includes(w));
}

export default function NewPostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const boardIdParam = searchParams.get('board');
  const { isAuthenticated } = useAuthStore();

  // Form state
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(
    boardIdParam ? parseInt(boardIdParam, 10) : null,
  );
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sensitiveWords, setSensitiveWords] = useState<string[]>([]);
  const [sensitiveHits, setSensitiveHits] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load boards
  useEffect(() => {
    getBoards()
      .then((data) => {
        setBoards(data);
        if (boardIdParam) {
          const matched = data.find(
            (b) => b.id === parseInt(boardIdParam, 10) || b.slug === boardIdParam,
          );
          if (matched) setSelectedBoardId(matched.id);
        }
      })
      .catch(() => toast.error('加载版块列表失败'))
      .finally(() => setBoardsLoading(false));
  }, [boardIdParam]);

  // Load sensitive words
  useEffect(() => {
    loadSensitiveWords().then(setSensitiveWords);
  }, []);

  // Sensitive word detection (300ms debounce)
  useEffect(() => {
    if (sensitiveWords.length === 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const titleHits = checkSensitive(sensitiveWords, title);
      const contentHits = checkSensitive(sensitiveWords, content);
      setSensitiveHits([...new Set([...titleHits, ...contentHits])]);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, content, sensitiveWords]);

  // Draft save
  useEffect(() => {
    if (!selectedBoardId || (!title && !content)) return;
    const timer = setTimeout(() => {
      const draft = { boardId: selectedBoardId, tags: selectedTags, title, content, coverImageUrl };
      try {
        localStorage.setItem(
          `vibeDev:draft:post:${selectedBoardId}`,
          JSON.stringify(draft),
        );
      } catch {
        // localStorage full, ignore
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [selectedBoardId, selectedTags, title, content, coverImageUrl]);

  // Load draft
  useEffect(() => {
    if (!selectedBoardId) return;
    try {
      const raw = localStorage.getItem(`vibeDev:draft:post:${selectedBoardId}`);
      if (raw) {
        const draft = JSON.parse(raw);
        if (!title && !content) {
          setSelectedTags(draft.tags || []);
          setTitle(draft.title || '');
          setContent(draft.content || '');
          setCoverImageUrl(draft.coverImageUrl || '');
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [selectedBoardId]);

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
    if (sensitiveHits.length > 0) errs.sensitive = '内容包含敏感词：';
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
        tags: selectedTags,
        coverImageUrl: coverImageUrl || undefined,
        idempotencyKey,
      });
      // Clear draft
      localStorage.removeItem(`vibeDev:draft:post:${selectedBoardId}`);
      toast.success('发布成功！');
      setTimeout(() => navigate(`/post/${post.id}`, { replace: true }), 500);
    } catch (err: any) {
      const msg = err?.message || '发布失败，请稍后重试';
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  }, [validate, selectedBoardId, title, content, selectedTags, coverImageUrl, navigate]);

  // Character counter color
  const titleCountColor =
    title.length === 0 || title.length >= 5
      ? title.length > 100
        ? 'text-red-500'
        : 'text-gray-400'
      : 'text-gray-400';

  // No auth
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center py-16">
          <p className="text-lg text-gray-500">请先登录后再发帖</p>
        </div>
      </div>
    );
  }

  return (
    <div className="new-post max-w-4xl mx-auto py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">发布新帖</h1>

      {/* Board selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">选择版块</label>
        <select
          value={selectedBoardId || ''}
          onChange={(e) => {
            setSelectedBoardId(e.target.value ? parseInt(e.target.value, 10) : null);
            setSelectedTags([]);
          }}
          className={`w-full max-w-xs border rounded-md px-3 py-2 text-sm bg-white outline-none transition-colors duration-150 ${
            errors.board ? 'border-red-500' : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-50'
          }`}
        >
          <option value="">请选择版块</option>
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {errors.board && <p className="mt-1 text-xs text-red-500">{errors.board}</p>}
      </div>

      {/* Tag selector */}
      {currentBoard && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">选择标签（1-3个）</label>
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

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">标题</label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入标题（5-100 字符）"
            maxLength={100}
            className={`w-full border rounded-md px-3 py-2.5 text-xl font-medium outline-none transition-colors duration-150 ${
              errors.title || sensitiveHits.some((w) => title.includes(w))
                ? 'border-red-500'
                : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-50'
            }`}
          />
          <span className={`absolute right-3 bottom-2 text-xs ${titleCountColor}`}>
            {title.length}/100
          </span>
        </div>
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>

      {/* Cover image upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">封面图（可选）</label>
        {coverImageUrl ? (
          <div className="relative inline-block">
            <img
              src={coverImageUrl}
              alt="封面图"
              className="w-48 h-32 object-cover rounded-md border border-gray-200"
            />
            <button
              type="button"
              onClick={() => setCoverImageUrl('')}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white text-xs rounded-full flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="输入封面图 URL 或使用下方图片上传"
              className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
          </div>
        )}
      </div>

      {/* Markdown editor */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">内容</label>
        <MarkdownSplitEditor
          value={content}
          onChange={setContent}
          placeholder="请输入帖子内容，支持 Markdown 语法"
        />
        {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
      </div>

      {/* Image uploader */}
      <div className="mb-4">
        <ImageUploader
          images={uploadedImages}
          onImagesChange={setUploadedImages}
          maxCount={10}
          maxSizeMB={5}
        />
      </div>

      {/* Sensitive word warning */}
      {sensitiveHits.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <span className="text-red-500 font-medium text-sm">!</span>
          <span className="text-sm text-red-600">
            内容包含敏感词：
          </span>
          <div className="flex gap-1.5 ml-2">
            {sensitiveHits.map((word) => (
              <span key={word} className="px-1.5 py-px text-xs bg-red-100 text-red-600 rounded">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Publish button */}
      <div className="flex items-center justify-between sticky bottom-0 bg-white py-4 border-t border-gray-100">
        <span className="text-sm text-gray-400">
          {selectedBoardId ? '已选择版块' : '请选择版块'} · {selectedTags.length} 个标签 · {content.length} 字
        </span>
        <Button
          variant="primary"
          size="lg"
          loading={publishing}
          disabled={sensitiveHits.length > 0}
          onClick={handlePublish}
        >
          {publishing ? '发布中...' : sensitiveHits.length > 0 ? '内容包含违规词汇' : '发布'}
        </Button>
      </div>
    </div>
  );
}
