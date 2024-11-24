import create from 'zustand';

interface UIStore {
  isWhiteboardVisible: boolean;
  isCodeEditorVisible: boolean;
  isRecording: boolean;
  toggleWhiteboard: () => void;
  toggleCodeEditor: () => void;
  setRecording: (recording: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isWhiteboardVisible: false,
  isCodeEditorVisible: false,
  isRecording: false,
  toggleWhiteboard: () => set((state) => ({ 
    isWhiteboardVisible: !state.isWhiteboardVisible,
    isCodeEditorVisible: false 
  })),
  toggleCodeEditor: () => set((state) => ({ 
    isCodeEditorVisible: !state.isCodeEditorVisible,
    isWhiteboardVisible: false 
  })),
  setRecording: (recording) => set({ isRecording: recording }),
}));