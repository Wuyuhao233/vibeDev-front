import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, updatePost, type PostDetail, type UpdatePostData } from '../api/post';
import { useAuthStore } from '../store/authStore';
import MarkdownSplitEditor from '../components/MarkdownSplitEditor';
import { Button, toast } from '../components/ui';
import PostDetailSkeleton from '../components/PostDetailSkeleton';
import { ErrorEmpty } from '../components/shared';

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Load post
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPost(id)
      .then((data) => {
        setPost(data);
        setTitle(data.title);
        setContent(data.contentMarkdown);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || '加载失败');
        setLoading(false);
      });
  }, [id]);

  // Permission check
  const canEdit = user && post && (
    user.id === post.author.id ||
    user.role === 'moderator' ||
    user.role === 'admin'
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const handleSave = useCallback(async () => {
    if (!id || !post) return;

    if (!title.trim() || title.length < 5 || title.length > 100) {
      toast.error('标题长度需在 5-100 字符之间');
      return;
    }
    if (!content.trim()) {
      toast.error('请输入帖子内容');
      return;
    }

    setSaving(true);
    try {
      const data: UpdatePostData = {
        title: title.trim(),
        content: content.trim(),
        version: post.version,
      };
      await updatePost(id, data);
      toast.success('保存成功');
      navigate(`/post/${id}`, { replace: true });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('version') || msg.includes('VERSION')) {
        toast.error('内容已被他人编辑，请刷新后重试');
      } else {
        toast.error(msg || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  }, [id, post, title, content, navigate]);

  if (loading) return <PostDetailSkeleton />;
  if (error) return <ErrorEmpty description={error || undefined} onRetry={() => window.location.reload()} />;
  if (!canEdit) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">没有编辑权限</p>
          <button
            onClick={() => navigate(`/post/${id}`, { replace: true })}
            className="mt-4 text-sm text-primary hover:underline"
          >
            返回帖子
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-post-page max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">编辑帖子</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(`/post/${id}`)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存修改'}
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入文章标题..."
          maxLength={100}
          className="w-full text-2xl font-bold border border-border rounded-lg px-4 py-3 outline-none focus:border-primary bg-card text-foreground placeholder:text-muted-foreground"
        />
        <span className={`text-sm mt-1 inline-block ${title.length < 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
          {title.length}/100（至少5字符）
        </span>
      </div>

      {/* Editor */}
      <div className="min-h-[400px] border border-border rounded-lg overflow-hidden">
        <MarkdownSplitEditor
          value={content}
          onChange={setContent}
          placeholder="请输入文章内容，支持 Markdown 语法"
        />
      </div>
    </div>
  );
}
