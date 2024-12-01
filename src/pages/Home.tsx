import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JoinScreen } from "../components/JoinScreen";
import { useRoomStore } from "../stores/roomStore";
import { useCanvasStore } from "../stores/canvasStore";

export const Home = () => {
  const navigate = useNavigate();
  const { joinRoom } = useRoomStore();
  const { setRoomId } = useCanvasStore();

  const handleJoin = async (name: string, roomId: string) => {
    await joinRoom(roomId, name);
    setRoomId(roomId);
    navigate(`/room/${roomId}`, { state: { participantName: name } });
  };

  return <JoinScreen onJoin={handleJoin} />;
};
