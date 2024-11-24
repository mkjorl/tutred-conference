import create from 'zustand';

interface WhiteboardStore {
  tool: string;
  color: string;
  strokeWidth: number;
  history: string[];
  currentIndex: number;
  setTool: (tool: string) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  addToHistory: (state: string) => void;
  undo: () => string | null;
  redo: () => string | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useWhiteboardStore = create<WhiteboardStore>((set, get) => ({
  tool: 'pencil',
  color: '#000000',
  strokeWidth: 2,
  history: [],
  currentIndex: -1,

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  addToHistory: (state) => set(store => {
    const newHistory = [...store.history.slice(0, store.currentIndex + 1), state];
    return {
      history: newHistory,
      currentIndex: newHistory.length - 1
    };
  }),

  undo: () => {
    const { history, currentIndex } = get();
    if (currentIndex <= 0) return null;
    set({ currentIndex: currentIndex - 1 });
    return history[currentIndex - 1];
  },

  redo: () => {
    const { history, currentIndex } = get();
    if (currentIndex >= history.length - 1) return null;
    set({ currentIndex: currentIndex + 1 });
    return history[currentIndex + 1];
  },

  canUndo: () => get().currentIndex > 0,
  canRedo: () => get().currentIndex < get().history.length - 1,
}));