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
import { useScreenShareStore } from "../stores/screenShareStore";
import { DraggableVideo } from "./DraggableVideo";
import { Tooltip } from "./Tooltip";
import AudioComponent from "./AudioTrack";
import { useSocket } from "../hooks/useSocket";

interface VideoConferenceProps {
  participantName: string;
  roomName: string;
}

export const VideoConference: React.FC<VideoConferenceProps> = ({
  participantName,
  roomName,
}) => {
  const [egressId, setEgressId] = useState(null);
  const [showWhiteboardTooltip, setShowWhiteboardTooltip] = useState(false);
  const { sendOpenCanvas } = useSocket();

  const startRecording = async () => {
    console.log("Starting recording...");
    const response = await fetch(
      import.meta.env.VITE_SIGNALING_SERVER + "/api/record-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomName: roomName }),
      }
    );

    const { egressId } = await response.json();
    setEgressId(egressId);
    console.log("Recording started!", egressId);
  };

  const stopRecording = async () => {
    const response = await fetch(
      import.meta.env.VITE_SIGNALING_SERVER + "/api/record-session",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ egressId }),
      }
    );

    setEgressId(null);
    console.log("Recording stopped!");
  };

  const {
    isRecording,
    localTrack,
    remoteTracks,
    connectionError,
    isConnecting,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
  } = useRoomStore();

  const { isVideoOn, isAudioOn } = useVideoStore();
  const { isScreenSharing } = useScreenShareStore();

  const {
    isWhiteboardVisible,
    toggleWhiteboard,
    isCodeEditorVisible,
    toggleCodeEditor,
  } = useUIStore();

  const { receiveCanvasOpen } = useSocket();

  useEffect(() => {
    receiveCanvasOpen(() => {
      if (!isWhiteboardVisible) {
        setShowWhiteboardTooltip(true);
      }
    });
  }, [receiveCanvasOpen]);

  const handleToggleVideo = async () => {
    await toggleVideo();
  };

  const handleToggleAudio = async () => {
    await toggleAudio();
  };

  const handleToggleScreenShare = async () => {
    await toggleScreenShare();
  };

  const renderError = () => {
    if (!connectionError) return null;

    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 text-red-800 rounded-lg p-4 max-w-md text-center">
          {connectionError}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-1 relative p-4">
        {renderError() || (
          <div className="relative h-full grid grid-cols-2 gap-4">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              {localTrack ? (
                <DraggableVideo
                  stream={localTrack}
                  label={`You (${participantName})`}
                  muted={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  {isConnecting ? "Connecting..." : "Camera Off"}
                </div>
              )}
            </div>

            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              {remoteTracks.length > 0 ? (
                remoteTracks.map((track) =>
                  track.trackPublication.kind === "video" ? (
                    <DraggableVideo
                      key={track.trackPublication.trackSid}
                      stream={track.trackPublication.videoTrack}
                      label={track.participantIdentity}
                    />
                  ) : (
                    <AudioComponent
                      key={track.trackPublication.trackSid}
                      track={track.trackPublication.audioTrack}
                    />
                  )
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  Waiting for others to join...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900/90 backdrop-blur-sm p-4 border-t border-gray-800">
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleToggleAudio}
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
            onClick={handleToggleVideo}
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
            onClick={handleToggleScreenShare}
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
            onClick={() => {
              stopRecording();
            }}
            className={`p-3 rounded-lg  hover:bg-gray-700 text-white transition-colors ${
              isRecording ? "bg-red-500" : "bg-gray-600"
            }`}
            title="Screen Recording"
          >
            <CircleDot size={20} />
          </button>

          <Tooltip
            content="Canvas session started! Start collaborating."
            show={showWhiteboardTooltip}
          >
            <button
              onClick={() => {
                sendOpenCanvas();
                toggleWhiteboard();
              }}
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
            <span>Room:</span>
            <code className="bg-gray-700 px-2 py-1 rounded">{roomName}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
