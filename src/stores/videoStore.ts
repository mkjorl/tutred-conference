import create from "zustand";

type LayoutMode = "split" | "focusLocal" | "focusRemote";

interface VideoStore {
  isVideoOn: boolean;
  isAudioOn: boolean;
  layoutMode: LayoutMode;
  selectedVideoInput: string;
  selectedAudioInput: string;
  selectedAudioOutput: string;
  toggleVideo: () => void;
  toggleAudio: () => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setSelectedVideoInput: (deviceId: string) => void;
  setSelectedAudioInput: (deviceId: string) => void;
  setSelectedAudioOutput: (deviceId: string) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  isVideoOn: true,
  isAudioOn: true,
  layoutMode: "split",
  selectedVideoInput: "default",
  selectedAudioInput: "default",
  selectedAudioOutput: "default",
  toggleVideo: () => set((state) => ({ isVideoOn: !state.isVideoOn })),
  toggleAudio: () => set((state) => ({ isAudioOn: !state.isAudioOn })),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setSelectedVideoInput: (deviceId) => set({ selectedVideoInput: deviceId }),
  setSelectedAudioInput: (deviceId) => set({ selectedAudioInput: deviceId }),
  setSelectedAudioOutput: (deviceId) => set({ selectedAudioOutput: deviceId }),
}));
