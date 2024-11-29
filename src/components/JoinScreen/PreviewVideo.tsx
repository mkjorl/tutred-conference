import React, { useEffect, useRef } from "react";
import { useVideoStore } from "../../stores/videoStore";

export const PreviewVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { isVideoOn, selectedVideoInput, selectedAudioInput } = useVideoStore();

  useEffect(() => {
    const setupVideo = async () => {
      try {
        if (isVideoOn) {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId:
                selectedVideoInput !== "default"
                  ? selectedVideoInput
                  : undefined,
            },
            audio: {
              deviceId:
                selectedAudioInput !== "default"
                  ? selectedAudioInput
                  : undefined,
            },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        } else {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
          }
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    setupVideo();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOn, selectedVideoInput, selectedAudioInput]);

  if (!isVideoOn) {
    return (
      <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-white text-sm">Camera is turned off</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover rounded-lg"
    />
  );
};
