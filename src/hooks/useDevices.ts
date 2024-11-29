import { useState, useEffect } from "react";

interface DeviceInfo {
  deviceId: string;
  label: string;
}

export const useDevices = () => {
  const [audioInputs, setAudioInputs] = useState<DeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<DeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<DeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = async () => {
    try {
      // Request permission to access devices
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

      const devices = await navigator.mediaDevices.enumerateDevices();

      setAudioInputs(
        devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label:
              device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
          }))
      );

      setVideoInputs(
        devices
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`,
          }))
      );

      setAudioOutputs(
        devices
          .filter((device) => device.kind === "audiooutput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Speaker ${device.deviceId.slice(0, 5)}...`,
          }))
      );

      setError(null);
    } catch (err) {
      setError("Failed to access media devices");
      console.error("Error accessing media devices:", err);
    }
  };

  useEffect(() => {
    loadDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
  }, []);

  return {
    audioInputs,
    videoInputs,
    audioOutputs,
    error,
    refreshDevices: loadDevices,
  };
};
