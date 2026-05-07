import { create } from 'zustand';
import type { Board } from '../api/board';

interface BoardState {
  boards: Board[];
  loaded: boolean;
  setBoards: (boards: Board[]) => void;
  getBoard: (slug: string) => Board | undefined;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  loaded: false,
  setBoards: (boards) => set({ boards, loaded: true }),
  getBoard: (slug) => get().boards.find((b) => b.slug === slug),
}));
