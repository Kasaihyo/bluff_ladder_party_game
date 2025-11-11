import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Lobby } from "./Lobby";
import { QuestionScreen } from "./QuestionScreen";
import { StoryPhase } from "./StoryPhase";
import { VotePhase } from "./VotePhase";
import { RevealScreen } from "./RevealScreen";
import { GameEnd } from "./GameEnd";

export function MainMonitor() {
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  const createRoom = useMutation(api.rooms.createRoom);
  const seedQuestions = useMutation(api.questions.seedQuestions);
  const room = useQuery(api.rooms.getRoom, roomId ? { roomId } : "skip");

  useEffect(() => {
    const initRoom = async () => {
      try {
        await seedQuestions();
        const result = await createRoom();
        setRoomId(result.roomId);
      } catch (error) {
        console.error("Failed to initialize room:", error);
        alert("Failed to create room. Please refresh the page.");
      }
    };
    if (!roomId) {
      initRoom();
    }
  }, [roomId, createRoom, seedQuestions]);

  if (!room || !roomId) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {room.state === "LOBBY" && <Lobby roomId={roomId} room={room} />}
      {room.state === "QUESTION" && <QuestionScreen roomId={roomId} room={room} />}
      {room.state === "STORY" && <StoryPhase roomId={roomId} room={room} />}
      {room.state === "VOTE" && <VotePhase roomId={roomId} room={room} />}
      {room.state === "REVEAL" && <RevealScreen roomId={roomId} room={room} />}
      {room.state === "GAME_END" && <GameEnd roomId={roomId} room={room} />}
    </div>
  );
}
