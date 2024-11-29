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
import {
  LocalVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
} from "livekit-client";
import { useVideoStore } from "../stores/videoStore";
import { useUIStore } from "../stores/uiStore";
import { DraggableVideo } from "./DraggableVideo";
import { ScreenRecorder } from "./ScreenRecorder";
import { Tooltip } from "./Tooltip";
import { faker } from "@faker-js/faker";

type TrackInfo = {
  trackPublication: RemoteTrackPublication;
  participantIdentity: string;
};

let APPLICATION_SERVER_URL = "";
let LIVEKIT_URL = "";
configureUrls();

function configureUrls() {
  // If APPLICATION_SERVER_URL is not configured, use default value from OpenVidu Local deployment
  if (!APPLICATION_SERVER_URL) {
    if (window.location.hostname === "localhost") {
      APPLICATION_SERVER_URL = "http://localhost:3000/";
    } else {
      APPLICATION_SERVER_URL = "https://" + window.location.hostname + ":6443/";
    }
  }

  // If LIVEKIT_URL is not configured, use default value from OpenVidu Local deployment
  if (!LIVEKIT_URL) {
    if (window.location.hostname === "localhost") {
      LIVEKIT_URL = "ws://localhost:7880/";
    } else {
      LIVEKIT_URL = "wss://" + window.location.hostname + ":7443/";
    }
  }
}

export const VideoConference = () => {
  const [room, setRoom] = useState<Room | undefined>(undefined);
  const [localTrack, setLocalTrack] = useState<LocalVideoTrack | undefined>(
    undefined
  );
  const [remoteTracks, setRemoteTracks] = useState<TrackInfo[]>([]);

  const [participantName, setParticipantName] = useState(
    "Participant" + Math.floor(Math.random() * 100)
  );
  const [roomName, setRoomName] = useState("Test Room");

  const [showRecorder, setShowRecorder] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showWhiteboardTooltip, setShowWhiteboardTooltip] = useState(false);

  const {
    isVideoOn,
    isAudioOn,
    streams,
    sessionId,
    connectionError,
    toggleVideo,
    toggleAudio,
    joinSession,
    leaveSession,
    publishStream,
  } = useVideoStore();

  const {
    isWhiteboardVisible,
    toggleWhiteboard,
    isCodeEditorVisible,
    toggleCodeEditor,
  } = useUIStore();

  async function joinRoom() {
    // Initialize a new Room object
    const room = new Room();
    setRoom(room);

    // Specify the actions when events take place in the room
    // On every new Track received...
    room.on(
      RoomEvent.TrackSubscribed,
      (
        _track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        setRemoteTracks((prev) => [
          ...prev,
          {
            trackPublication: publication,
            participantIdentity: participant.identity,
          },
        ]);
      }
    );

    // On every Track destroyed...
    room.on(
      RoomEvent.TrackUnsubscribed,
      (_track: RemoteTrack, publication: RemoteTrackPublication) => {
        setRemoteTracks((prev) =>
          prev.filter(
            (track) => track.trackPublication.trackSid !== publication.trackSid
          )
        );
      }
    );

    try {
      // Get a token from your application server with the room name and participant name
      const token = await getToken(roomName, participantName);

      // Connect to the room with the LiveKit URL and the token
      await room.connect(LIVEKIT_URL, token);

      // Publish your camera and microphone
      await room.localParticipant.enableCameraAndMicrophone();
      setLocalTrack(
        room.localParticipant.videoTrackPublications.values().next().value
          .videoTrack
      );
    } catch (error) {
      console.log(error);
      console.log(
        "There was an error connecting to the room:",
        (error as Error).message
      );
      await leaveRoom();
    }
  }

  useEffect(() => {
    joinRoom();
  }, []);

  async function leaveRoom() {
    // Leave the room by calling 'disconnect' method over the Room object
    await room?.disconnect();

    // Reset the state
    setRoom(undefined);
    setLocalTrack(undefined);
    setRemoteTracks([]);
  }

  async function getToken(roomName: string, participantName: string) {
    const response = await fetch(APPLICATION_SERVER_URL + "get-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomName: roomName,
        participantName: participantName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get token: ${error.errorMessage}`);
    }

    const data = await response.json();
    return data.token;
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await publishStream();
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        await publishStream();
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          publishStream();
          setIsScreenSharing(false);
        };
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

  // const localStream = streams.find(
  //   (stream) => stream.stream?.streamId === sessionId
  // );
  // const remoteStreams = streams.filter(
  //   (stream) => stream.stream?.streamId !== sessionId
  // );

  console.log(localTrack);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-1 relative p-4">
        {renderError() || (
          <div className="relative h-full grid grid-cols-2 gap-4">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              {localTrack ? (
                <DraggableVideo
                  stream={localTrack || null}
                  label="You (Tutor)"
                  muted={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  Connecting...
                </div>
              )}
            </div>

            {/* Remote Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              {/* {remoteStreams.length > 0 ? (
                <DraggableVideo
                  stream={remoteStreams[0].stream?.getMediaStream() || null}
                  label="Student"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  Waiting for student to join...
                </div>
              )} */}
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
            <span>Session ID:</span>
            <code className="bg-gray-700 px-2 py-1 rounded">classroom-1</code>
          </div>
        </div>
      </div>
    </div>
  );
};
