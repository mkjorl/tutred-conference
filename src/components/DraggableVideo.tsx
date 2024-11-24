import React, { useState, useRef, useEffect } from 'react';
import { useVideoStream } from '../hooks/useVideoStream';

interface DraggableVideoProps {
  stream: MediaStream | null;
  label: string;
  className?: string;
  muted?: boolean;
}

export const DraggableVideo: React.FC<DraggableVideoProps> = ({ 
  stream, 
  label, 
  className = '',
  muted = false
}) => {
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useVideoStream(stream);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const parentRect = containerRef.current.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    
    const newX = Math.min(
      Math.max(0, e.clientX - dragStart.x),
      parentRect.width - containerRect.width
    );
    const newY = Math.min(
      Math.max(0, e.clientY - dragStart.y),
      parentRect.height - containerRect.height
    );

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
      className={`absolute cursor-move shadow-lg ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
      }}
      onMouseDown={handleMouseDown}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover rounded-lg"
      />
      <div className="absolute bottom-2 left-2 text-white bg-black/50 px-2 py-1 text-sm rounded-full">
        {label}
      </div>
    </div>
  );
};