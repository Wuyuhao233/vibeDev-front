import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSettings, updateSetting, recalculatePoints } from '../../api/admin';
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
  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculate = async () => {
    if (!window.confirm('确认要重算全站用户积分吗？此操作将根据积分日志重新计算所有用户的积分和等级。')) return;
    setRecalculating(true);
    try {
      const result = await recalculatePoints();
      toast.success(`积分重算完成，更新了 ${result.updatedUsers} 个用户`);
    } catch (err: any) {
      toast.error(err?.message || '积分重算失败');
    } finally {
      setRecalculating(false);
    }
  };

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

      {settings.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">全站积分重算</h2>
          <p className="text-sm text-gray-500 mb-4">
            根据积分日志重新计算所有用户的积分和等级。此操作不可撤销，建议在低峰期执行。
          </p>
          <Button
            onClick={handleRecalculate}
            disabled={recalculating}
            variant="destructive"
          >
            {recalculating ? '重算中...' : '全站积分重算'}
          </Button>
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
