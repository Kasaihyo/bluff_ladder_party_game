import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect, useState } from "react";

type StoryPhaseProps = {
  roomId: Id<"rooms">;
  room: any;
};

export function StoryPhase({ roomId, room }: StoryPhaseProps) {
  const hotSeatPlayer = useQuery(
    api.players.getPlayer,
    room.hotSeatPlayerId ? { playerId: room.hotSeatPlayerId } : "skip"
  );
  const updateRoomState = useMutation(api.rooms.updateRoomState);

  const [timeLeft, setTimeLeft] = useState(room.settings.storyTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          updateRoomState({ roomId, state: "VOTE" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roomId, updateRoomState]);

  if (!hotSeatPlayer) {
    return <div>Loading...</div>;
  }

  const progress = (timeLeft / room.settings.storyTime) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <h2 className="text-4xl font-bold mb-8">Tell Your Story</h2>

      <div className="mb-8">
        <div className="text-6xl mb-4">🎤</div>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl">{hotSeatPlayer.emoji || "👤"}</span>
          <span className="text-2xl font-bold">{hotSeatPlayer.name}</span>
        </div>
      </div>

      <div className="relative w-64 h-64 mx-auto mb-6">
        <svg className="transform -rotate-90 w-64 h-64">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="#e5e7eb"
            strokeWidth="16"
            fill="none"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="#4F46E5"
            strokeWidth="16"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-primary">{timeLeft}s</span>
        </div>
      </div>

      <p className="text-xl text-gray-600">
        Convince the judges you know the answer...
      </p>
    </div>
  );
}
