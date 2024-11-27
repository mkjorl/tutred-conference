import { useState, useEffect } from "react";
import { useRoomStore } from "../stores/roomStore";
import { MediaServer } from "../services/mediaServer";

export const useRemoteStream = (roomId: string) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useRoomStore();

  useEffect(() => {
    if (!isConnected || !roomId) return;

    const mediaServer = MediaServer.getInstance();

    const handleRemoteStream = (stream: MediaStream) => {
      console.log("stream", stream);
      setRemoteStream(stream);
      setError(null);
    };

    const handleError = (err: Error) => {
      console.error("Remote stream error:", err);
      setError("Failed to connect to remote stream");
      setRemoteStream(null);
    };

    try {
      // Subscribe to remote stream events
      mediaServer.onRemoteStream(handleRemoteStream);
      mediaServer.onRemoteStreamError(handleError);
    } catch (err) {
      handleError(err as Error);
    }

    return () => {
      // Cleanup subscriptions
      mediaServer.offRemoteStream(handleRemoteStream);
      mediaServer.offRemoteStreamError(handleError);
    };
  }, [roomId, isConnected]);

  return {
    remoteStream,
    error,
    setRemoteStream,
  };
};
