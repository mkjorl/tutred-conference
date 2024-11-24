import React, { useState, useEffect, useRef } from 'react';
import { Check, Copy } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onClose }) => {
  const [hexValue, setHexValue] = useState(color.replace('#', ''));
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const spectrumRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.color-picker-container')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSpectrumMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSpectrumMouseMove(e);
  };

  const handleSpectrumMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && e.type !== 'mousedown') return;
    if (!spectrumRef.current) return;

    const rect = spectrumRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setSaturation(x * 100);
    setBrightness(100 - (y * 100));
    updateColorFromHSB(hue, x * 100, 100 - (y * 100));
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value);
    setHue(newHue);
    updateColorFromHSB(newHue, saturation, brightness);
  };

  const updateColorFromHSB = (h: number, s: number, b: number) => {
    const rgb = HSBToRGB(h, s, b);
    const hex = RGBToHex(rgb.r, rgb.g, rgb.b);
    onChange('#' + hex);
    setHexValue(hex);
  };

  const HSBToRGB = (h: number, s: number, b: number) => {
    s /= 100;
    b /= 100;
    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    return {
      r: Math.round(255 * f(5)),
      g: Math.round(255 * f(3)),
      b: Math.round(255 * f(1))
    };
  };

  const RGBToHex = (r: number, g: number, b: number) => {
    return [r, g, b]
      .map(x => Math.round(x).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('#' + hexValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="color-picker-container bg-white rounded-lg shadow-xl border p-4 w-80">
      <div className="mb-4 space-y-4">
        {/* Color Spectrum Box */}
        <div 
          ref={spectrumRef}
          className="relative w-full h-48 rounded-lg cursor-crosshair"
          style={{
            background: `linear-gradient(to right, #fff 0%, hsl(${hue}, 100%, 50%) 100%)`
          }}
          onMouseDown={handleSpectrumMouseDown}
          onMouseMove={handleSpectrumMouseMove}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, #000 100%)'
            }}
          />
          <div
            className="absolute w-4 h-4 -translate-x-2 -translate-y-2 border-2 border-white rounded-full shadow-sm pointer-events-none"
            style={{
              left: `${saturation}%`,
              top: `${100 - brightness}%`,
              backgroundColor: `#${hexValue}`
            }}
          />
        </div>

        {/* Hue Slider */}
        <input
          type="range"
          min="0"
          max="360"
          value={hue}
          onChange={handleHueChange}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
          }}
        />

        {/* Selected Color Preview */}
        <div 
          className="w-full h-12 rounded-lg border shadow-inner"
          style={{ backgroundColor: '#' + hexValue }}
        />

        {/* Hex Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hex Color
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">#</span>
            <input
              type="text"
              value={hexValue}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
                setHexValue(value);
                if (value.length === 6) {
                  onChange('#' + value);
                }
              }}
              maxLength={6}
              className="flex-1 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              title="Copy hex code"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Colors */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recent Colors
        </label>
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 16 }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
                onChange(color);
                setHexValue(color.replace('#', ''));
              }}
              className="w-6 h-6 rounded-md border shadow-sm hover:scale-110 transition-transform"
              style={{ backgroundColor: `hsl(${(i * 360) / 16}, 70%, 50%)` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};