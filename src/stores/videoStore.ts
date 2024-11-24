import create from 'zustand';

type LayoutMode = 'split' | 'focusLocal' | 'focusRemote';

interface VideoStore {
  isVideoOn: boolean;
  isAudioOn: boolean;
  layoutMode: LayoutMode;
  toggleVideo: () => void;
  toggleAudio: () => void;
  setLayoutMode: (mode: LayoutMode) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  isVideoOn: true,
  isAudioOn: true,
  layoutMode: 'split',
  toggleVideo: () => set((state) => ({ isVideoOn: !state.isVideoOn })),
  toggleAudio: () => set((state) => ({ isAudioOn: !state.isAudioOn })),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
}));