import React, { useEffect, useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Pencil, 
  Code, 
  Monitor,
  MonitorOff,
  CircleDot,
} from 'lucide-react';
import { useVideoStore } from '../stores/videoStore';
import { useUIStore } from '../stores/uiStore';
import { DraggableVideo } from './DraggableVideo';
import { ScreenRecorder } from './ScreenRecorder';

export const VideoConference = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string>('');
  const [showRecorder, setShowRecorder] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  const { 
    isVideoOn, 
    isAudioOn, 
    toggleVideo, 
    toggleAudio,
  } = useVideoStore();
  
  const { 
    isWhiteboardVisible, 
    toggleWhiteboard, 
    isCodeEditorVisible, 
    toggleCodeEditor 
  } = useUIStore();

  useEffect(() => {
    const initializeStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: isAudioOn,
        });
        setLocalStream(stream);
        setPermissionError('');

        // Simulate remote stream for demo purposes
        // In production, this would come from WebRTC connection
        const fakeRemoteStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setRemoteStream(fakeRemoteStream);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setPermissionError('Please enable camera and microphone access to use video conferencing.');
      }
    };

    initializeStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoOn, isAudioOn]);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStream?.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-1 relative p-4">
        <div className="relative h-full grid grid-cols-2 gap-4">
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              autoPlay
              playsInline
              muted
              ref={(video) => {
                if (video && (isScreenSharing ? screenStream : localStream)) {
                  video.srcObject = isScreenSharing ? screenStream : localStream;
                }
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
              {isScreenSharing ? 'Screen Share' : 'You (Tutor)'}
            </div>
          </div>

          {/* Remote Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              autoPlay
              playsInline
              ref={(video) => {
                if (video && remoteStream) {
                  video.srcObject = remoteStream;
                }
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
              Student
            </div>
          </div>
        </div>

        {showRecorder && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-96">
              <ScreenRecorder onClose={() => setShowRecorder(false)} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900/90 backdrop-blur-sm p-4 border-t border-gray-800">
        <div className="flex justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-lg ${
              isAudioOn ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
            } text-white transition-colors`}
            title={isAudioOn ? 'Mute' : 'Unmute'}
          >
            {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-lg ${
              isVideoOn ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
            } text-white transition-colors`}
            title={isVideoOn ? 'Stop Video' : 'Start Video'}
          >
            {isVideoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-lg ${
              isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-700'
            } text-white transition-colors`}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>
          
          <button
            onClick={() => setShowRecorder(true)}
            className="p-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            title="Screen Recording"
          >
            <CircleDot size={20} />
          </button>
          
          <button
            onClick={toggleWhiteboard}
            className={`p-3 rounded-lg ${
              isWhiteboardVisible ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-700'
            } text-white transition-colors`}
            title="Toggle Whiteboard"
          >
            <Pencil size={20} />
          </button>
          
          <button
            onClick={toggleCodeEditor}
            className={`p-3 rounded-lg ${
              isCodeEditorVisible ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-600 hover:bg-gray-700'
            } text-white transition-colors`}
            title="Toggle Code Editor"
          >
            <Code size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};