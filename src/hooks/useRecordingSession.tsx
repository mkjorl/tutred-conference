import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
} from "livekit-client";
import { TrackInfo } from "../stores/roomStore";

let APPLICATION_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER;
let LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

export const useRecordingSession = (sessionName: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [streams, setStreams] = useState<TrackInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [mounted, setMounted] = useState(false);
  const params = useSearchParams();

  const token = params?.[0].get("token");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      console.log("sub");
      const newRoom = new Room();
      setRoom(newRoom);

      newRoom.on(
        RoomEvent.TrackSubscribed,
        (
          _track: RemoteTrack,
          publication: RemoteTrackPublication,
          participant: RemoteParticipant
        ) => {
          setStreams((prev) => {
            prev = [
              ...prev,
              {
                trackPublication: publication,
                participantIdentity: participant.identity,
              },
            ];
            return prev;
          });
        }
      );

      newRoom.on(
        RoomEvent.TrackUnsubscribed,
        (_track: RemoteTrack, publication: RemoteTrackPublication) => {
          setStreams((streams) =>
            streams.filter(
              (track) =>
                track.trackPublication.trackSid !== publication.trackSid
            )
          );
        }
      );

      const connectToSession = async () => {
        try {
          if (!token) {
            throw new Error("No token provided");
          }
          console.log("Connecting to session...");
          console.log("Token:", token);
          console.log("LIVEKIT_URL:", LIVEKIT_URL);
          await newRoom.connect(LIVEKIT_URL, token);
          setIsConnecting(false);
        } catch (err) {
          console.error("Connection error:", err);
          setError("Failed to connect to the session");
          setIsConnecting(false);
        }
      };

      connectToSession();

      return () => {
        setStreams([]);
        setMounted(true);

        room?.disconnect();
      };
    }
  }, [sessionName, mounted]);

  return {
    streams,
    error,
    isConnecting,
  };
};
