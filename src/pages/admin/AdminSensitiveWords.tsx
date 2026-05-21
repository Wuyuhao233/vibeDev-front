import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  getSensitiveWords,
  createSensitiveWord,
  updateSensitiveWord,
  deleteSensitiveWord,
  toggleSensitiveWord,
  batchImportSensitiveWords,
} from '../../api/admin';
import type { SensitiveWord } from '../../types/admin';
import {
  Button,
  Input,
  Spinner,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui';
import { ErrorEmpty, PaginationComponent } from '../../components/shared';

const PAGE_SIZE = 20;

export default function AdminSensitiveWords() {
  const [words, setWords] = useState<SensitiveWord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [enabledFilter, setEnabledFilter] = useState<boolean | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<SensitiveWord | null>(null);
  const [wordForm, setWordForm] = useState({ word: '', category: '' });
  const [saving, setSaving] = useState(false);

  // Import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean> = { page, pageSize: PAGE_SIZE };
      if (enabledFilter !== '') params.enabled = enabledFilter;
      if (categoryFilter) params.category = categoryFilter;
      const data = await getSensitiveWords(params);
      setWords(data.items || []);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message || '加载敏感词列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, enabledFilter, categoryFilter]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  function openCreate() {
    setEditingWord(null);
    setWordForm({ word: '', category: '通用' });
    setModalOpen(true);
  }

  function openEdit(w: SensitiveWord) {
    setEditingWord(w);
    setWordForm({ word: w.word, category: w.category });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!wordForm.word.trim()) {
      toast.error('敏感词不能为空');
      return;
    }
    setSaving(true);
    try {
      if (editingWord) {
        await updateSensitiveWord(editingWord.id, wordForm);
        toast.success('敏感词已更新');
      } else {
        await createSensitiveWord(wordForm);
        toast.success('敏感词已添加');
      }
      setModalOpen(false);
      fetchWords();
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(w: SensitiveWord) {
    try {
      await deleteSensitiveWord(w.id);
      toast.success('敏感词已删除');
      fetchWords();
    } catch (err: any) {
      toast.error(err?.message || '删除失败');
    }
  }

  async function handleToggle(w: SensitiveWord) {
    try {
      const updated = await toggleSensitiveWord(w.id);
      setWords((prev) =>
        prev.map((item) => (item.id === w.id ? { ...item, enabled: updated.enabled } : item))
      );
      toast.success(updated.enabled ? '已启用' : '已禁用');
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await batchImportSensitiveWords(form);
      toast.success(`成功导入 ${result.imported} 个敏感词`);
      fetchWords();
    } catch (err: any) {
      toast.error(err?.message || '导入失败');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">敏感词库</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? '导入中...' : '批量导入'}
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleImport} className="hidden" />
          <Button onClick={openCreate}>添加敏感词</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={enabledFilter === '' ? '' : String(enabledFilter)}
          onChange={(e) => { setEnabledFilter(e.target.value === '' ? '' : e.target.value === 'true'); setPage(1); }}
          className="h-9 px-3 border border-border rounded-md text-sm bg-card text-foreground/80"
        >
          <option value="">全部状态</option>
          <option value="true">已启用</option>
          <option value="false">已禁用</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 border border-border rounded-md text-sm bg-card text-foreground/80"
        >
          <option value="">全部分类</option>
          <option value="通用">通用</option>
          <option value="政治">政治</option>
          <option value="色情">色情</option>
          <option value="广告">广告</option>
          <option value="辱骂">辱骂</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-muted-foreground">加载中...</span>
        </div>
      ) : error ? (
        <ErrorEmpty description={error} onRetry={fetchWords} />
      ) : words.length === 0 ? (
        <Empty>
                  <EmptyHeader>
                    <EmptyTitle>暂无敏感词</EmptyTitle>
                    <EmptyDescription>点击上方按钮添加</EmptyDescription>
                  </EmptyHeader>
                </Empty>
      ) : (
        <>
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">敏感词</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">分类</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">状态</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {words.map((w) => (
                  <tr key={w.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{w.word}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{w.category}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(w)}
                        className="relative inline-flex items-center h-5 w-9 rounded-full transition-colors duration-150"
                        style={{ backgroundColor: w.enabled ? '#3b82f6' : '#d1d5db' }}
                      >
                        <span
                          className="inline-block w-3.5 h-3.5 rounded-full bg-card shadow-sm transition-transform duration-150"
                          style={{ transform: w.enabled ? 'translateX(18px)' : 'translateX(4px)' }}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(w)} className="text-xs text-primary hover:text-primary mr-3">
                        编辑
                      </button>
                      <button onClick={() => handleDelete(w)} className="text-xs text-red-500 hover:text-red-600">
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <PaginationComponent currentPage={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWord ? '编辑敏感词' : '添加敏感词'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-foreground mb-1">敏感词</label>
              <Input
                value={wordForm.word}
                onChange={(e) => setWordForm((f) => ({ ...f, word: e.target.value }))}
                placeholder="输入敏感词"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">分类</label>
              <select
                value={wordForm.category}
                onChange={(e) => setWordForm((f) => ({ ...f, category: e.target.value }))}
                className="h-9 w-full px-3 border border-border rounded-md text-sm bg-card"
              >
                <option value="通用">通用</option>
                <option value="政治">政治</option>
                <option value="色情">色情</option>
                <option value="广告">广告</option>
                <option value="辱骂">辱骂</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
