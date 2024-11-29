import React from "react";
import { Settings, Video, Mic, Volume2 } from "lucide-react";
import { DeviceSelect } from "./DeviceSelect";
import { useDevices } from "../../hooks/useDevices";
import { useVideoStore } from "../../stores/videoStore";

interface DeviceSettingsProps {
  onClose: () => void;
}

export const DeviceSettings: React.FC<DeviceSettingsProps> = ({ onClose }) => {
  const { audioInputs, videoInputs, audioOutputs, error } = useDevices();
  const {
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    setSelectedAudioInput,
    setSelectedVideoInput,
    setSelectedAudioOutput,
  } = useVideoStore();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Device Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error ? (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
              {error}
            </div>
          ) : (
            <>
              <DeviceSelect
                devices={videoInputs}
                selectedDeviceId={selectedVideoInput}
                onChange={setSelectedVideoInput}
                label="Camera"
                icon={<Video className="h-5 w-5 text-gray-400" />}
              />

              <DeviceSelect
                devices={audioInputs}
                selectedDeviceId={selectedAudioInput}
                onChange={setSelectedAudioInput}
                label="Microphone"
                icon={<Mic className="h-5 w-5 text-gray-400" />}
              />

              <DeviceSelect
                devices={audioOutputs}
                selectedDeviceId={selectedAudioOutput}
                onChange={setSelectedAudioOutput}
                label="Speaker"
                icon={<Volume2 className="h-5 w-5 text-gray-400" />}
              />
            </>
          )}
        </div>

        <div className="flex justify-end px-4 py-3 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
