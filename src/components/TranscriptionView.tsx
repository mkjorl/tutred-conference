import React, { useState, useEffect } from 'react';
import { Play, Square, Download, Clock, CheckCircle2 } from 'lucide-react';
import { useTranscriptionStore } from '../stores/transcriptionStore';

export const TranscriptionView = () => {
  const { 
    transcripts,
    isRecording,
    startRecording,
    stopRecording,
    clearTranscripts
  } = useTranscriptionStore();

  const downloadTranscript = () => {
    const text = transcripts
      .map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.speaker}: ${t.text}`)
      .join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {transcripts.map((transcript, index) => (
          <div 
            key={index}
            className={`flex items-start space-x-3 ${
              transcript.speaker === 'You' ? 'justify-end' : ''
            }`}
          >
            <div className={`max-w-[80%] rounded-lg p-3 ${
              transcript.speaker === 'You'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium">{transcript.speaker}</span>
                <Clock size={12} className="opacity-50" />
                <span className="text-xs opacity-75">
                  {new Date(transcript.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p>{transcript.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-lg ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
            >
              {isRecording ? <Square size={20} /> : <Play size={20} />}
            </button>
            {isRecording && (
              <div className="flex items-center space-x-2 text-red-500">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">Recording</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadTranscript}
              disabled={transcripts.length === 0}
              className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download Transcript"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};