import create from "zustand";
import { socketService } from "../services/socketService";

interface CanvasUpdate {
  data: any;
  timestamp: string;
  sender: string;
}

interface CodeUpdate {
  code: string;
  language: string;
  timestamp: string;
  sender: string;
}

interface SocketState {
  roomId: string | null;
  isConnected: boolean;
  lastUpdate: string | null;
  clientId: string;
  setRoomId: (id: string) => void;
  sendCanvasUpdate: (data: any) => void;
  receiveCanvasUpdate: (callback: (update: CanvasUpdate) => void) => void;
  sendOpenCanvas: () => void;
  receiveCanvasOpen: (callback: (update: CanvasUpdate) => void) => void;
  sendCodeUpdate: (code: string, language: string) => void;
  receiveCodeUpdate: (callback: (update: CodeUpdate) => void) => void;
  disconnect: () => void;
}

export const useSocket = create<SocketState>((set, get) => ({
  roomId: null,
  isConnected: false,
  lastUpdate: null,
  clientId: crypto.randomUUID(),

  setRoomId: (id: string) => {
    set({ roomId: id });
    const socket = socketService.connect(id);

    socket?.on("connect", () => {
      set({ isConnected: true });
    });

    socket?.on("disconnect", () => {
      set({ isConnected: false });
    });
  },

  sendCanvasUpdate: (data: any) => {
    const socket = socketService.getSocket();

    if (socket) {
      console.log("sendCanvasUpdate");
      const update: CanvasUpdate = {
        data,
        timestamp: new Date().toISOString(),
        sender: get().clientId,
      };

      socket.emit("canvas:update", {
        roomId: get().roomId,
        ...update,
      });

      set({ lastUpdate: update.timestamp });
    }
  },

  receiveCanvasUpdate: (callback: (update: CanvasUpdate) => void) => {
    const socket = socketService.getSocket();
    console.log("receving canvas update", socket);
    if (socket) {
      socket.on("canvas:update", (update: CanvasUpdate) => {
        console.log("receivedCanvasUpdate");
        if (update.sender !== get().clientId) {
          callback(update);
          set({ lastUpdate: update.timestamp });
        }
      });
    }
  },

  sendOpenCanvas: () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit("canvas:open", {
        roomId: get().roomId,
      });
    }
  },
  receiveCanvasOpen: (callback: (update: CanvasUpdate) => void) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.on("canvas:open", (update: CanvasUpdate) => {
        if (update.sender !== get().clientId) {
          callback(update);
        }
      });
    }
  },

  sendCodeUpdate: (code: string, language: string) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit("code:update", {
        roomId: get().roomId,
        update: {
          code,
          language,
          timestamp: new Date().toISOString(),
          sender: get().clientId,
        },
      });
    }
  },
  receiveCodeUpdate: (callback: (update: CodeUpdate) => void) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.on("code:update", (update: CodeUpdate) => {
        if (update.sender !== get().clientId) {
          callback(update);
        }
      });
    }
  },

  disconnect: () => {
    socketService.disconnect();
    set({ isConnected: false, roomId: null });
  },
}));
