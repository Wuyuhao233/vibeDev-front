import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminSettings from '../pages/admin/AdminSettings';

vi.mock('../api/admin', () => ({
  getSettings: vi.fn(),
  updateSetting: vi.fn(),
  recalculatePoints: vi.fn(),
}));

import * as adminApi from '../api/admin';

const mockSettings = [
  { key: 'site.name', value: 'vibeDev', description: '站点名称' },
  { key: 'site.description', value: '开发者社区', description: '站点描述' },
];

function renderComponent() {
  return render(
    <MemoryRouter>
      <AdminSettings />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminApi.getSettings).mockResolvedValue({ items: mockSettings, total: 2 });
  vi.mocked(adminApi.updateSetting).mockResolvedValue({} as any);
  vi.mocked(adminApi.recalculatePoints).mockResolvedValue({ updatedUsers: 5 });
});

describe('AdminSettings - recalculate button', () => {
  it('renders recalculate section after settings load', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '全站积分重算' })).toBeInTheDocument();
    });
  });

  it('shows description text for recalculate', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '全站积分重算' })).toBeInTheDocument();
    });
    expect(
      screen.getByText(/根据积分日志重新计算所有用户的积分和等级/)
    ).toBeInTheDocument();
  });

  it('shows recalculate button', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '全站积分重算' })).toBeInTheDocument();
    });
    const btn = screen.getByRole('button', { name: '全站积分重算' });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('calls recalculatePoints API on confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '全站积分重算' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: '全站积分重算' }));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminApi.recalculatePoints).toHaveBeenCalled();
    });
    confirmSpy.mockRestore();
  });

  it('does not call API if confirm is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '全站积分重算' })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: '全站积分重算' }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(adminApi.recalculatePoints).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
