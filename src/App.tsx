import React, { useState } from "react";
import { VideoConference } from "./components/VideoConference";
import { Whiteboard } from "./components/Whiteboard";
import { Chat } from "./components/Chat";
import { CodeEditor } from "./components/CodeEditor";
import { useUIStore } from "./stores/uiStore";
import { JoinScreen } from "./components/JoinScreen";
import { useRoomStore } from "./stores/roomStore";

function App() {
  const { isWhiteboardVisible, isCodeEditorVisible } = useUIStore();
  const [hasJoined, setHasJoined] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [roomId, setRoomId] = useState("");
  const { joinRoom } = useRoomStore();

  const handleJoin = (name: string, room: string) => {
    setParticipantName(name);
    setRoomId(room);
    setHasJoined(true);
    joinRoom(room, name);
  };

  if (!hasJoined) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-poppins">
      <header className="bg-white shadow-sm p-2">
        <h1 className="text-xl font-semibold text-center text-gray-900">
          Interactive Tutoring Session
        </h1>
      </header>

      <main className="flex-1 grid grid-cols-4 gap-2 p-2 overflow-hidden">
        <div className="col-span-3">
          <div className="relative h-full">
            <div
              className={`absolute inset-0 transition-all duration-300 ${
                isWhiteboardVisible
                  ? "scale-50 origin-top-left translate-x-1/4 translate-y-1/4 opacity-75 hover:opacity-100"
                  : "scale-100"
              }`}
            >
              <VideoConference
                participantName={participantName}
                roomName={roomId}
              />
            </div>

            <div
              className={`absolute inset-0 transition-all duration-300 ${
                isWhiteboardVisible ? "opacity-100 z-10" : "opacity-0 -z-10"
              }`}
            >
              <Whiteboard />
            </div>
          </div>
        </div>

        <div className="col-span-1 relative">
          <div
            className={`absolute inset-0 transition-all duration-300 ${
              isCodeEditorVisible ? "opacity-0 -z-10" : "opacity-100 z-10"
            }`}
          >
            <Chat />
          </div>
          <div
            className={`absolute inset-0 transition-all duration-300 ${
              isCodeEditorVisible ? "opacity-100 z-10" : "opacity-0 -z-10"
            }`}
          >
            <CodeEditor />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
