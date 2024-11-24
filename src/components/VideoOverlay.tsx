import React, { useState, useRef, useEffect } from 'react';

interface VideoOverlayProps {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({ stream, label, muted = false }) => {
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current?.parentElement) return;

    const parentRect = containerRef.current.parentElement.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const maxX = parentRect.width - containerRect.width - 16;
    const maxY = parentRect.height - containerRect.height - 16;

    const newX = Math.min(Math.max(16, e.clientX - dragStart.x), maxX);
    const newY = Math.min(Math.max(16, e.clientY - dragStart.y), maxY);

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="absolute w-1/4 aspect-video cursor-move bg-gray-800 rounded-lg overflow-hidden shadow-lg"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        zIndex: isDragging ? 30 : 20
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-sm">
          No stream available
        </div>
      )}
      <div className="absolute bottom-2 left-2 text-white bg-black/50 px-2 py-0.5 rounded-full text-xs">
        {label}
      </div>
    </div>
  );
};