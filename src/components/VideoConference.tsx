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
import { DraggableVideo } from "./DraggableVideo";
import { ScreenRecorder } from "./ScreenRecorder";
import { Tooltip } from "./Tooltip";
import AudioComponent from "./AudioTrack";

interface VideoConferenceProps {
  participantName: string;
  roomName: string;
}

export const VideoConference: React.FC<VideoConferenceProps> = ({
  participantName,
  roomName,
}) => {
  const [showRecorder, setShowRecorder] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showWhiteboardTooltip, setShowWhiteboardTooltip] = useState(false);

  const { room, localTrack, remoteTracks, connectionError, isConnecting } =
    useRoomStore();

  const { isVideoOn, isAudioOn, toggleVideo, toggleAudio } = useVideoStore();

  const {
    isWhiteboardVisible,
    toggleWhiteboard,
    isCodeEditorVisible,
    toggleCodeEditor,
  } = useUIStore();

  const toggleScreenShare = async () => {
    if (!room) return;

    if (isScreenSharing) {
      await room.localParticipant.setScreenShareEnabled(false);
      setIsScreenSharing(false);
    } else {
      try {
        await room.localParticipant.setScreenShareEnabled(true);
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    }
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
              onClick={toggleWhiteboard}
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
