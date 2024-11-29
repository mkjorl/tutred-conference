import React from "react";
import { Settings } from "lucide-react";

interface DeviceSelectProps {
  devices: Array<{ deviceId: string; label: string }>;
  selectedDeviceId: string;
  onChange: (deviceId: string) => void;
  label: string;
  icon?: React.ReactNode;
}

export const DeviceSelect: React.FC<DeviceSelectProps> = ({
  devices,
  selectedDeviceId,
  onChange,
  label,
  icon,
}) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <select
          value={selectedDeviceId}
          onChange={(e) => onChange(e.target.value)}
          className={`block w-full ${
            icon ? "pl-10" : "pl-3"
          } pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg`}
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
