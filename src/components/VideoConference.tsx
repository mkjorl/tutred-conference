import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useVideoStore } from "../stores/videoStore";
import { useUIStore } from "../stores/uiStore";
import { useRoomStore } from "../stores/roomStore";
import { useRemoteStream } from "../hooks/useRemoteStream";
import { DraggableVideo } from "./DraggableVideo";
import { ScreenRecorder } from "./ScreenRecorder";
import { Tooltip } from "./Tooltip";
import { useCanvasStore } from "../stores/canvasStore";
import { useSocket } from "../hooks/useSocket";

export const VideoConference = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string>("");
  const [showRecorder, setShowRecorder] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [showWhiteboardTooltip, setShowWhiteboardTooltip] = useState(false);
  const [roomId] = useState("1234");

  const {
    setRoomId: setSocketRoomId,
    sendOpenCanvas,
    receiveCanvasOpen,
  } = useSocket();
  const { joinRoom, leaveRoom, produceStream } = useRoomStore();
  const { remoteStream, error: remoteStreamError } = useRemoteStream(roomId);

  console.log("remoteStream", remoteStream);
  console.log("localStream", localStream);

  const { isVideoOn, isAudioOn, toggleVideo, toggleAudio } = useVideoStore();
  const {
    isWhiteboardVisible,
    toggleWhiteboard,
    isCodeEditorVisible,
    toggleCodeEditor,
  } = useUIStore();

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        // Set up socket connection
        setSocketRoomId(roomId);

        // Join WebRTC room
        await joinRoom(roomId);

        // Get media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: isAudioOn,
        });

        // Send stream to server
        await produceStream(stream);

        setLocalStream(stream);
        setPermissionError("");

        // Listen for whiteboard events
        receiveCanvasOpen(() => {
          if (!isWhiteboardVisible) {
            setShowWhiteboardTooltip(true);
          }
        });
      } catch (err) {
        console.error("Error initializing connection:", err);
        setPermissionError(
          "Failed to connect. Please check your camera and microphone permissions."
        );
      }
    };

    initializeConnection();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      leaveRoom();
    };
  }, [roomId]);

  // Handle media device changes
  useEffect(() => {
    const updateStream = async () => {
      if (!localStream) return;

      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];

      if (videoTrack) {
        videoTrack.enabled = isVideoOn;
      }
      if (audioTrack) {
        audioTrack.enabled = isAudioOn;
      }

      // Update server with new stream state
      await produceStream(localStream);
    };

    updateStream();
  }, [isVideoOn, isAudioOn, localStream]);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStream?.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);

      // Resume camera stream
      if (localStream) {
        await produceStream(localStream);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        // Send screen share stream to server
        await produceStream(stream);

        setScreenStream(stream);
        setIsScreenSharing(true);

        // Handle stream end (user stops sharing)
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setIsScreenSharing(false);
          if (localStream) {
            produceStream(localStream);
          }
        };
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    }
  };

  const handleWhiteboardToggle = () => {
    sendOpenCanvas();
    toggleWhiteboard();
  };

  const renderError = () => {
    const errorMessage = permissionError || remoteStreamError;
    if (!errorMessage) return null;

    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 text-red-800 rounded-lg p-4 max-w-md text-center">
          {errorMessage}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-1 relative p-4">
        {renderError() || (
          <div className="relative h-full grid grid-cols-2 gap-4">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                autoPlay
                playsInline
                muted
                ref={(video) => {
                  if (video && (isScreenSharing ? screenStream : localStream)) {
                    video.srcObject = isScreenSharing
                      ? screenStream
                      : localStream;
                  }
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                {isScreenSharing ? "Screen Share" : "You (Tutor)"}
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              {remoteStream ? (
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
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  Waiting for student to join...
                </div>
              )}
              {remoteStream && (
                <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                  Student
                </div>
              )}
            </div>
          </div>
        )}

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
              isAudioOn
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-red-500 hover:bg-red-600"
            } text-white transition-colors`}
            title={isAudioOn ? "Mute" : "Unmute"}
          >
            {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-lg ${
              isVideoOn
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-red-500 hover:bg-red-600"
            } text-white transition-colors`}
            title={isVideoOn ? "Stop Video" : "Start Video"}
          >
            {isVideoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-lg ${
              isScreenSharing
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-600 hover:bg-gray-700"
            } text-white transition-colors`}
            title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
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

          <Tooltip
            content="Canvas session started! Start collaborating."
            show={showWhiteboardTooltip}
          >
            <button
              onClick={handleWhiteboardToggle}
              className={`p-3 rounded-lg ${
                isWhiteboardVisible
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white transition-colors`}
              title="Toggle Whiteboard"
            >
              <Pencil size={20} />
            </button>
          </Tooltip>

          <button
            onClick={toggleCodeEditor}
            className={`p-3 rounded-lg ${
              isCodeEditorVisible
                ? "bg-purple-500 hover:bg-purple-600"
                : "bg-gray-600 hover:bg-gray-700"
            } text-white transition-colors`}
            title="Toggle Code Editor"
          >
            <Code size={20} />
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="bg-gray-800 rounded-lg px-4 py-2 text-gray-300 text-sm flex items-center space-x-2">
            <span>Room ID:</span>
            <code className="bg-gray-700 px-2 py-1 rounded">{roomId}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
