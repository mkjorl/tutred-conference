import create from "zustand";
import { socketService } from "../services/socketService";

interface CodeUpdate {
  code: string;
  language: string;
  timestamp: string;
  sender: string;
}

interface CodeEditorState {
  code: string;
  language: string;
  lastUpdate: string | null;
  updateCode: (code: string, language: string) => void;
  setLanguage: (language: string) => void;
  subscribeToUpdates: () => void;
}

export const useCodeEditorStore = create<CodeEditorState>((set, get) => ({
  code: "// Start coding here\n",
  language: "javascript",
  lastUpdate: null,

  updateCode: (code: string, language: string) => {
    set({ code, language });

    socketService.getSocket()?.emit("code:update", {
      roomId: socketService.getRoomId(),
      update: {
        code,
        language,
        timestamp: new Date().toISOString(),
        sender: socketService.getClientId(),
      },
    });
  },

  setLanguage: (language: string) => {
    set({ language });
  },

  subscribeToUpdates: () => {
    socketService.connect(socketService.getRoomId() || "", {
      onCodeUpdate: (update: CodeUpdate) => {
        if (update.sender !== socketService.getClientId()) {
          set({
            code: update.code,
            language: update.language,
            lastUpdate: update.timestamp,
          });
        }
      },
    });
  },
}));
