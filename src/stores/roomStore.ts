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

let APPLICATION_SERVER_URL = "";
let LIVEKIT_URL = "";

if (window.location.hostname === "localhost") {
  APPLICATION_SERVER_URL = "http://localhost:3000/";
  LIVEKIT_URL = "ws://localhost:7880/";
} else {
  APPLICATION_SERVER_URL = "https://" + window.location.hostname + ":6443/";
  LIVEKIT_URL = "wss://" + window.location.hostname + ":7443/";
}

interface TrackInfo {
  trackPublication: RemoteTrackPublication;
  participantIdentity: string;
}

interface RoomStore {
  room: Room | undefined;
  localTrack: LocalVideoTrack | undefined;
  remoteTracks: TrackInfo[];
  connectionError: string | null;
  isConnecting: boolean;
  joinRoom: (roomName: string, participantName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  room: undefined,
  localTrack: undefined,
  remoteTracks: [],
  connectionError: null,
  isConnecting: false,

  joinRoom: async (roomName: string, participantName: string) => {
    const room = new Room();
    set({ isConnecting: true, connectionError: null });

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
      const response = await fetch(APPLICATION_SERVER_URL + "get-token", {
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

      const { selectedVideoInput, selectedAudioInput } =
        useVideoStore.getState();
      await room.localParticipant.enableCameraAndMicrophone({
        videoDeviceId: selectedVideoInput,
        audioDeviceId: selectedAudioInput,
      });

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
