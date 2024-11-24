import React, { useState } from 'react';
import { Video, Square, Download, X } from 'lucide-react';
import RecordRTC from 'recordrtc';

interface ScreenRecorderProps {
  onClose: () => void;
}

export const ScreenRecorder: React.FC<ScreenRecorderProps> = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<RecordRTC | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const newRecorder = new RecordRTC(stream, { type: 'video' });
      newRecorder.startRecording();
      setRecorder(newRecorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (!recorder) return;
    recorder.stopRecording(() => {
      setRecordedBlob(recorder.getBlob());
      setIsRecording(false);
    });
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Screen Recording</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X size={20} />
        </button>
      </div>
      
      <div className="p-8 flex flex-col items-center space-y-6">
        <div className="flex space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Video size={20} />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <Square size={20} />
              <span>Stop Recording</span>
            </button>
          )}
          
          {recordedBlob && (
            <button
              onClick={downloadRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Download size={20} />
              <span>Download</span>
            </button>
          )}
        </div>
        
        {isRecording && (
          <div className="flex items-center space-x-2 text-red-500">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Recording in progress...</span>
          </div>
        )}
      </div>
    </div>
  );
};