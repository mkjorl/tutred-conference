import create from 'zustand';

interface Suggestion {
  id: string;
  type: 'explanation' | 'solution' | 'problem';
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface AIStore {
  isEnabled: boolean;
  suggestions: Suggestion[];
  transcription: string;
  toggleAI: () => void;
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  updateTranscription: (text: string) => void;
  unreadCount: number;
}

export const useAIStore = create<AIStore>((set, get) => ({
  isEnabled: false,
  suggestions: [],
  transcription: '',
  unreadCount: 0,
  toggleAI: () => set((state) => ({ isEnabled: !state.isEnabled })),
  addSuggestion: (suggestion) => 
    set((state) => ({
      suggestions: [...state.suggestions, {
        ...suggestion,
        id: Date.now().toString(),
        isRead: false
      }],
      unreadCount: state.unreadCount + 1
    })),
  markAsRead: (id) => 
    set((state) => ({
      suggestions: state.suggestions.map(s => 
        s.id === id ? { ...s, isRead: true } : s
      ),
      unreadCount: state.unreadCount - 1
    })),
  updateTranscription: (text) => set({ transcription: text })
}));