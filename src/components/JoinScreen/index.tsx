import React from "react";
import { JoinForm } from "./JoinForm";
import { PreviewVideo } from "./PreviewVideo";
import { Laptop2 } from "lucide-react";

interface JoinScreenProps {
  onJoin: (name: string, roomId: string) => void;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 md:p-8">
            <div className="flex items-center space-x-2 mb-8">
              <Laptop2 className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-semibold text-gray-900">
                Interactive Tutoring
              </h1>
            </div>
            <JoinForm onJoin={onJoin} />
          </div>

          <div className="bg-gray-900 p-6 flex flex-col">
            <h2 className="text-white text-lg font-medium mb-4">
              Video Preview
            </h2>
            <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
              <PreviewVideo />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
