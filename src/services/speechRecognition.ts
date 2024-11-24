import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { useAIStore } from '../stores/aiStore';
import { useTranscriptionStore } from '../stores/transcriptionStore';

class AzureSpeechService {
  private speechConfig: sdk.SpeechConfig | null = null;
  private recognizer: sdk.SpeechRecognizer | null = null;
  private isListening: boolean = false;

  constructor() {
    // Initialize Azure Speech config
    const subscriptionKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
    const region = import.meta.env.VITE_AZURE_SPEECH_REGION;

    if (subscriptionKey && region) {
      try {
        this.speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, region);
        this.speechConfig.speechRecognitionLanguage = 'en-US';
        this.speechConfig.enableDictation();
      } catch (error) {
        console.error('Failed to initialize Azure Speech Services:', error);
      }
    }
  }

  private setupRecognizer() {
    if (!this.speechConfig) return;

    try {
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      this.recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);

      this.recognizer.recognized = (_, event) => {
        if (event.result.reason === sdk.ResultReason.RecognizedSpeech) {
          const transcript = event.result.text.trim();
          if (transcript) {
            this.processTranscript(transcript);
          }
        }
      };

      this.recognizer.canceled = (_, event) => {
        if (event.reason === sdk.CancellationReason.Error) {
          useAIStore.getState().addSuggestion({
            type: 'problem',
            content: `Speech recognition error: ${event.errorDetails}`,
            timestamp: new Date().toISOString()
          });
        }
        this.isListening = false;
      };

    } catch (error) {
      console.error('Error setting up speech recognizer:', error);
    }
  }

  private processTranscript(transcript: string) {
    // Add to transcription store
    useTranscriptionStore.getState().addTranscript(transcript, 'You');

    // Process for AI suggestions
    if (transcript.toLowerCase().includes('explain')) {
      useAIStore.getState().addSuggestion({
        type: 'explanation',
        content: `Question detected: "${transcript}"`,
        timestamp: new Date().toISOString()
      });
    } else if (transcript.toLowerCase().includes('problem')) {
      useAIStore.getState().addSuggestion({
        type: 'problem',
        content: `Issue detected: "${transcript}"`,
        timestamp: new Date().toISOString()
      });
    } else if (transcript.toLowerCase().includes('how')) {
      useAIStore.getState().addSuggestion({
        type: 'solution',
        content: `How-to question detected: "${transcript}"`,
        timestamp: new Date().toISOString()
      });
    }
  }

  public start() {
    if (!this.recognizer || this.isListening) return;

    try {
      this.setupRecognizer();
      this.recognizer?.startContinuousRecognitionAsync(
        () => {
          this.isListening = true;
          useAIStore.getState().addSuggestion({
            type: 'explanation',
            content: 'Speech recognition is now active',
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.error('Error starting recognition:', error);
          this.isListening = false;
        }
      );
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }

  public stop() {
    if (!this.recognizer || !this.isListening) return;

    try {
      this.recognizer.stopContinuousRecognitionAsync(
        () => {
          this.isListening = false;
          if (this.recognizer) {
            this.recognizer.close();
            this.recognizer = null;
          }
        },
        (error) => {
          console.error('Error stopping recognition:', error);
        }
      );
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }

  public isSupported(): boolean {
    return !!this.speechConfig;
  }
}

export const speechRecognition = new AzureSpeechService();