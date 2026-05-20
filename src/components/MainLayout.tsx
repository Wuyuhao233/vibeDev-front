import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import { getBoards } from '../api/board';
import { useBoardStore } from '../store/boardStore';

export default function MainLayout() {
  const setBoards = useBoardStore((s) => s.setBoards);
  const location = useLocation();
  const isEditorRoute = location.pathname.startsWith('/post/new');
  const isSettingsRoute = location.pathname.startsWith('/settings');
  const isUserProfileRoute = location.pathname.startsWith('/u/');
  const hideSidebar = isEditorRoute || isSettingsRoute || isUserProfileRoute;

  useEffect(() => {
    getBoards()
      .then((data) => setBoards(data))
      .catch(() => { /* LeftSidebar handles error display */ });
  }, [setBoards]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      {!isEditorRoute && <Navbar />}
      {isEditorRoute ? (
        <main className="h-screen">
          <Outlet />
        </main>
      ) : (
        <div className="max-w-content mx-auto flex px-6 py-6 gap-6">
          {!hideSidebar && <LeftSidebar />}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
}
