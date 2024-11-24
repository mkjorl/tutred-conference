import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();

  useEffect(() => {
    if (!stream) return;

    // Check if stream has audio tracks
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 32;
      analyser.smoothingTimeConstant = 0.7;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const numberOfBars = 5;
      const spacing = 3;
      const barWidth = 2;
      const totalWidth = (numberOfBars * barWidth) + ((numberOfBars - 1) * spacing);
      
      // Center the visualization
      const startX = (canvas.width - totalWidth) / 2;

      const draw = () => {
        if (!ctx || !analyser) return;

        analyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw container
        ctx.fillStyle = 'rgba(75, 85, 99, 0.9)'; // gray-600 with opacity
        ctx.roundRect(0, 0, canvas.width, canvas.height, 6);
        ctx.fill();

        // Calculate average for 5 segments
        const segmentSize = Math.floor(dataArray.length / numberOfBars);
        const averages = Array.from({ length: numberOfBars }, (_, i) => {
          const start = i * segmentSize;
          const end = start + segmentSize;
          const segment = dataArray.slice(start, end);
          return segment.reduce((a, b) => a + b, 0) / segmentSize;
        });

        // Draw bars
        const maxBarHeight = canvas.height * 0.6; // 60% of container height
        const verticalPadding = (canvas.height - maxBarHeight) / 2;

        averages.forEach((value, i) => {
          const x = startX + (i * (barWidth + spacing));
          const height = (value / 255) * maxBarHeight;
          const y = verticalPadding + ((maxBarHeight - height) / 2);

          ctx.fillStyle = '#FFFFFF'; // White bars
          ctx.fillRect(x, y, barWidth, height);
        });

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        audioContext.close();
      };
    } catch (error) {
      console.error('Error initializing audio visualizer:', error);
    }
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      width={40}
      height={24}
      className="absolute bottom-4 right-4"
    />
  );
};