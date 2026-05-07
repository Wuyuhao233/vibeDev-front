import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSettings, updateSetting } from '../../api/admin';
import type { SettingItem } from '../../types/admin';
import {
  Button,
  Input,
  Spinner,
  ErrorState,
  Empty,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui';

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingSetting, setEditingSetting] = useState<SettingItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      setSettings(data.items || []);
    } catch (err: any) {
      setError(err?.message || '加载设置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  function openEdit(s: SettingItem) {
    setEditingSetting(s);
    setEditValue(s.value);
  }

  async function handleSave() {
    if (!editingSetting) return;
    setSaving(true);
    try {
      await updateSetting(editingSetting.key, editValue);
      toast.success('设置已保存');
      setEditingSetting(null);
      fetchSettings();
    } catch (err: any) {
      toast.error(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">系统设置</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      ) : error ? (
        <ErrorState title="加载失败" description={error} onRetry={fetchSettings} />
      ) : settings.length === 0 ? (
        <Empty title="暂无设置项" />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-1/6">键</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-1/4">值</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">说明</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s) => (
                <tr key={s.key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono text-xs">{s.key}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{s.value}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{s.description}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-xs text-primary-500 hover:text-primary-600"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editingSetting} onOpenChange={(v) => !v && setEditingSetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑设置 - {editingSetting?.key}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingSetting?.description && (
              <p className="text-sm text-gray-500">{editingSetting.description}</p>
            )}
            <div>
              <label className="block text-sm text-gray-700 mb-1">值</label>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSetting(null)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
