import create from 'zustand';
import { MediaServer } from '../services/mediaServer';

interface RoomStore {
  roomId: string | null;
  isConnected: boolean;
  connectionError: string | null;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  produceStream: (stream: MediaStream) => Promise<void>;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: null,
  isConnected: false,
  connectionError: null,

  joinRoom: async (roomId: string) => {
    try {
      const mediaServer = MediaServer.getInstance();
      await mediaServer.joinRoom(roomId);
      set({ roomId, isConnected: true, connectionError: null });
    } catch (error) {
      set({ connectionError: 'Failed to join room' });
      throw error;
    }
  },

  leaveRoom: () => {
    const mediaServer = MediaServer.getInstance();
    mediaServer.leaveRoom();
    set({ roomId: null, isConnected: false });
  },

  produceStream: async (stream: MediaStream) => {
    try {
      const mediaServer = MediaServer.getInstance();
      await mediaServer.produceStream(stream);
    } catch (error) {
      set({ connectionError: 'Failed to produce media stream' });
      throw error;
    }
  },
}));