import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  OpenVidu,
  Session,
  StreamManager,
  Publisher,
  Subscriber,
} from "openvidu-browser";
import { VideoPlayer } from "../components/recording/VideoPlayer";
import { useRecordingSession } from "../hooks/useRecordingSession";
import { AlertCircle } from "lucide-react";

export const RecordingView = () => {
  const { sessionName } = useParams();
  const { streams, error, isConnecting } = useRecordingSession(
    sessionName || ""
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-800 rounded-lg p-4 max-w-md flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          <span>Connecting to session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-white">
            Recording View: {sessionName}
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((stream) => (
            <VideoPlayer
              key={stream.streamManager.stream.streamId}
              streamManager={stream.streamManager}
              participantName={stream.participantName}
            />
          ))}

          {streams.length === 0 && (
            <div className="col-span-full flex items-center justify-center h-64 bg-gray-800 rounded-lg">
              <p className="text-gray-400">Waiting for participants...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
