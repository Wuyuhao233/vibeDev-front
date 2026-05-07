import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import { getBoards } from '../api/board';
import { useBoardStore } from '../store/boardStore';

export default function MainLayout() {
  const setBoards = useBoardStore((s) => s.setBoards);

  useEffect(() => {
    getBoards()
      .then((data) => setBoards(data))
      .catch(() => { /* LeftSidebar handles error display */ });
  }, [setBoards]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-content mx-auto flex px-6 py-6 gap-6">
        <LeftSidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
