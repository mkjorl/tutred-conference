import React, { useState } from "react";
import {
  UserCircle2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
} from "lucide-react";
import { useVideoStore } from "../../stores/videoStore";
import { DeviceSettings } from "../DeviceSelect/DeviceSettings";
import { useRoomStore } from "../../stores/roomStore";

interface JoinFormProps {
  onJoin: (name: string, roomId: string) => void;
}

export const JoinForm: React.FC<JoinFormProps> = ({ onJoin }) => {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const { isVideoOn, isAudioOn, toggleVideo, toggleAudio } = useVideoStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && roomId.trim()) {
      onJoin(name.trim(), roomId.trim());
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCircle2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="roomId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter room ID"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3 rounded-lg ${
              isVideoOn
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-red-500 hover:bg-red-600"
            } text-white transition-colors`}
            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            type="button"
            onClick={toggleAudio}
            className={`p-3 rounded-lg ${
              isAudioOn
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-red-500 hover:bg-red-600"
            } text-white transition-colors`}
            title={isAudioOn ? "Turn off microphone" : "Turn on microphone"}
          >
            {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            title="Device Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          Join Session
        </button>
      </form>

      {showSettings && (
        <DeviceSettings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};
