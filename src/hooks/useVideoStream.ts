import { useEffect, useRef } from 'react';

export const useVideoStream = (stream: MediaStream | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return videoRef;
};