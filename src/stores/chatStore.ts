import create from 'zustand';

interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  attachment?: FileAttachment;
}

interface ChatStore {
  messages: Message[];
  sendMessage: (message: Message) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  sendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
}));