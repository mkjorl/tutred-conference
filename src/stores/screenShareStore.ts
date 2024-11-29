import create from "zustand";

interface ScreenShareStore {
  isScreenSharing: boolean;
  screenTrack: MediaStreamTrack | null;
  setScreenSharing: (isSharing: boolean) => void;
  setScreenTrack: (track: MediaStreamTrack | null) => void;
}

export const useScreenShareStore = create<ScreenShareStore>((set) => ({
  isScreenSharing: false,
  screenTrack: null,
  setScreenSharing: (isSharing) => set({ isScreenSharing: isSharing }),
  setScreenTrack: (track) => set({ screenTrack: track }),
}));
