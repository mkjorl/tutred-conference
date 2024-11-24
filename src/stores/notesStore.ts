import create from 'zustand';

interface Note {
  id: string;
  type: 'text' | 'image';
  content: string;
  timestamp: string;
}

interface NotesStore {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'timestamp'>) => void;
  deleteNote: (id: string) => void;
  clearNotes: () => void;
}

export const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  addNote: (note) => set((state) => ({
    notes: [...state.notes, {
      ...note,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    }]
  })),
  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter(note => note.id !== id)
  })),
  clearNotes: () => set({ notes: [] })
}));