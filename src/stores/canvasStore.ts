import create from 'zustand';
import { socketService } from '../services/socketService';

interface CanvasUpdate {
  data: any;
  timestamp: string;
  sender: string;
}

interface CanvasState {
  roomId: string | null;
  isConnected: boolean;
  lastUpdate: string | null;
  clientId: string;
  setRoomId: (id: string) => void;
  sendCanvasUpdate: (data: any) => void;
  receiveCanvasUpdate: (callback: (update: CanvasUpdate) => void) => void;
  disconnect: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  roomId: null,
  isConnected: false,
  lastUpdate: null,
  clientId: crypto.randomUUID(),

  setRoomId: (id: string) => {
    set({ roomId: id });
    const socket = socketService.connect(id);

    socket?.on('connect', () => {
      set({ isConnected: true });
    });

    socket?.on('disconnect', () => {
      set({ isConnected: false });
    });
  },

  sendCanvasUpdate: (data: any) => {
    const socket = socketService.getSocket();
    if (socket) {
      const update: CanvasUpdate = {
        data,
        timestamp: new Date().toISOString(),
        sender: get().clientId
      };
      
      socket.emit('canvas:update', {
        roomId: get().roomId,
        ...update
      });
      
      set({ lastUpdate: update.timestamp });
    }
  },

  receiveCanvasUpdate: (callback: (update: CanvasUpdate) => void) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('canvas:update', (update: CanvasUpdate) => {
        if (update.sender !== get().clientId) {
          callback(update);
          set({ lastUpdate: update.timestamp });
        }
      });
    }
  },

  disconnect: () => {
    socketService.disconnect();
    set({ isConnected: false, roomId: null });
  }
}));