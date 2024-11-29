import { useEffect, useRef } from "react";
import { LocalVideoTrack, RemoteVideoTrack } from "livekit-client";

export const useVideoStream = (stream: LocalVideoTrack | RemoteVideoTrack) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      stream.attach(videoRef.current);
    }
  }, [stream]);

  return videoRef;
};
