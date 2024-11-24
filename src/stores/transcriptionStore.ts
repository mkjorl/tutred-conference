import create from 'zustand';
import { speechRecognition } from '../services/speechRecognition';

interface Transcript {
  text: string;
  speaker: 'You' | 'Student';
  timestamp: string;
}

interface TranscriptionStore {
  transcripts: Transcript[];
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  addTranscript: (text: string, speaker: 'You' | 'Student') => void;
  clearTranscripts: () => void;
}

export const useTranscriptionStore = create<TranscriptionStore>((set, get) => ({
  transcripts: [],
  isRecording: false,

  startRecording: () => {
    speechRecognition.start();
    set({ isRecording: true });
  },

  stopRecording: () => {
    speechRecognition.stop();
    set({ isRecording: false });
  },

  addTranscript: (text: string, speaker: 'You' | 'Student') => {
    set((state) => ({
      transcripts: [...state.transcripts, {
        text,
        speaker,
        timestamp: new Date().toISOString()
      }]
    }));
  },

  clearTranscripts: () => set({ transcripts: [] })
}));