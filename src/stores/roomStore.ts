import create from "zustand";
import {
  Room,
  RoomEvent,
  LocalVideoTrack,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
} from "livekit-client";
import { useVideoStore } from "./videoStore";
import { useScreenShareStore } from "./screenShareStore";
import { useSocket } from "../hooks/useSocket";

let APPLICATION_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER;
let LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

export interface TrackInfo {
  trackPublication: RemoteTrackPublication;
  participantIdentity: string;
}

interface RoomStore {
  room: Room | undefined;
  localTrack: LocalVideoTrack | undefined;
  remoteTracks: TrackInfo[];
  connectionError: string | null;
  isConnecting: boolean;
  isRecording: boolean;
  joinRoom: (roomName: string, participantName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  room: undefined,
  localTrack: undefined,
  remoteTracks: [],
  isRecording: false,
  connectionError: null,
  isConnecting: false,

  toggleVideo: async () => {
    const { room } = get();
    const { toggleVideo } = useVideoStore.getState();

    if (room) {
      try {
        await room.localParticipant.setCameraEnabled(
          !room.localParticipant.isCameraEnabled
        );
        toggleVideo();
      } catch (error) {
        console.error("Error toggling video:", error);
      }
    }
  },

  toggleAudio: async () => {
    const { room } = get();
    const { toggleAudio } = useVideoStore.getState();

    if (room) {
      try {
        await room.localParticipant.setMicrophoneEnabled(
          !room.localParticipant.isMicrophoneEnabled
        );
        toggleAudio();
      } catch (error) {
        console.error("Error toggling audio:", error);
      }
    }
  },

  toggleScreenShare: async () => {
    const { room } = get();
    const { setScreenSharing, setScreenTrack } = useScreenShareStore.getState();

    if (!room) return;

    try {
      const isCurrentlySharing = room.localParticipant.isScreenShareEnabled;

      if (isCurrentlySharing) {
        await room.localParticipant.setScreenShareEnabled(false);
        setScreenTrack(null);
      } else {
        await room.localParticipant.setScreenShareEnabled(true);
        const screenTrack = Array.from(
          room.localParticipant.screenShareTracks.values()
        )[0];
        if (screenTrack) {
          setScreenTrack(screenTrack.track);
        }
      }

      setScreenSharing(!isCurrentlySharing);
    } catch (error) {
      console.error("Error toggling screen share:", error);
      setScreenSharing(false);
      setScreenTrack(null);
    }
  },

  joinRoom: async (roomName: string, participantName: string) => {
    const room = new Room();
    set({ isConnecting: true, connectionError: null });
    const { setRoomId } = useSocket.getState();

    room.on(
      RoomEvent.TrackSubscribed,
      (
        _track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        set((state) => ({
          remoteTracks: [
            ...state.remoteTracks,
            {
              trackPublication: publication,
              participantIdentity: participant.identity,
            },
          ],
        }));
      }
    );
    console.log("subscriptions");
    room.on(RoomEvent.RecordingStatusChanged, (data: any) => {
      console.log("metadata changed", data);
    });

    room.on(
      RoomEvent.TrackUnsubscribed,
      (_track: RemoteTrack, publication: RemoteTrackPublication) => {
        set((state) => ({
          remoteTracks: state.remoteTracks.filter(
            (track) => track.trackPublication.trackSid !== publication.trackSid
          ),
        }));
      }
    );

    try {
      const response = await fetch(APPLICATION_SERVER_URL + "/api/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, participantName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get token: ${error.errorMessage}`);
      }

      const { token } = await response.json();
      await room.connect(LIVEKIT_URL, token);
      setRoomId(roomName);

      const { selectedVideoInput, selectedAudioInput, isVideoOn, isAudioOn } =
        useVideoStore.getState();

      await room.localParticipant.enableCameraAndMicrophone({
        videoDeviceId: selectedVideoInput,
        audioDeviceId: selectedAudioInput,
      });

      // Set initial video/audio state
      if (!isVideoOn) {
        await room.localParticipant.setCameraEnabled(false);
      }
      if (!isAudioOn) {
        await room.localParticipant.setMicrophoneEnabled(false);
      }

      const videoTrack = room.localParticipant.videoTrackPublications
        .values()
        .next().value;
      if (videoTrack) {
        set({ localTrack: videoTrack.videoTrack });
      }

      set({ room, isConnecting: false, connectionError: null });
    } catch (error) {
      console.error("Connection error:", error);
      set({
        connectionError: (error as Error).message,
        isConnecting: false,
      });
      await get().leaveRoom();
    }
  },

  leaveRoom: async () => {
    const { room } = get();
    if (room) {
      await room.disconnect();
    }
    set({
      room: undefined,
      localTrack: undefined,
      remoteTracks: [],
      connectionError: null,
    });
  },
}));
