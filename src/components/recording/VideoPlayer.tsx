import React, { useEffect, useRef } from "react";
import { StreamManager } from "openvidu-browser";
import { User } from "lucide-react";

interface VideoPlayerProps {
  streamManager: StreamManager;
  participantName: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamManager,
  participantName,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (streamManager && videoRef.current) {
      streamManager.addVideoElement(videoRef.current);
    }
  }, [streamManager]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-white/80" />
          <span className="text-sm text-white/80">{participantName}</span>
        </div>
      </div>
    </div>
  );
};
