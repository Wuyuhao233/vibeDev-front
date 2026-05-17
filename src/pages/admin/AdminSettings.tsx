import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSettings, updateSetting, recalculatePoints } from '../../api/admin';
import {
  Button,
  Input,
  Spinner,
  Empty,
  EmptyHeader,
  EmptyTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui';
import { ErrorEmpty } from '../../components/shared';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingLabel, setEditingLabel] = useState('');
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
      setSettings(data.settings || {});
    } catch (err: any) {
      setError(err?.message || '加载设置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  function openEdit(key: string, label: string, value: string) {
    setEditingKey(key);
    setEditingLabel(label);
    setEditingValue(value);
  }

  async function handleSave() {
    if (!editingKey) return;
    setSaving(true);
    try {
      await updateSetting(editingKey, editingValue);
      toast.success('设置已保存');
      setEditingKey(null);
      fetchSettings();
    } catch (err: any) {
      toast.error(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  const entries = Object.entries(settings);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">系统设置</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      ) : error ? (
        <ErrorEmpty description={error} onRetry={fetchSettings} />
      ) : entries.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无设置项</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-1/4">键</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">值</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{key}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-md truncate">{value}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(key, key, value)}
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

      {entries.length > 0 && (
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

      <Dialog open={!!editingKey} onOpenChange={(v) => !v && setEditingKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑设置 - {editingKey}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">值</label>
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingKey(null)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
