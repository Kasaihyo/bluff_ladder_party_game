import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect, useState } from "react";

type VotePhaseProps = {
  roomId: Id<"rooms">;
  room: any;
};

export function VotePhase({ roomId, room }: VotePhaseProps) {
  const players = useQuery(api.players.getPlayers, { roomId });
  const votes = useQuery(
    api.game.getVotes,
    room.currentQuestionId
      ? { roomId, questionId: room.currentQuestionId }
      : "skip"
  );
  const updateRoomState = useMutation(api.rooms.updateRoomState);

  const [timeLeft, setTimeLeft] = useState(room.settings.voteTime);

  const judgeCount =
    (players?.filter((p) => p._id !== room.hotSeatPlayerId).length || 0);
  const voteCount = votes?.length || 0;

  useEffect(() => {
    if (voteCount === judgeCount && judgeCount > 0) {
      updateRoomState({ roomId, state: "REVEAL" }).catch((error) => {
        console.error("Failed to update room state:", error);
      });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          updateRoomState({ roomId, state: "REVEAL" }).catch((error) => {
            console.error("Failed to update room state:", error);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [voteCount, judgeCount, roomId, updateRoomState]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <h2 className="text-4xl font-bold mb-8 text-primary">Vote Now!</h2>

      <div className="text-6xl mb-8">⚖️</div>

      <div className="text-3xl font-bold mb-6">{timeLeft}s</div>

      <p className="text-2xl text-gray-600 mb-8">
        Do you believe them?
      </p>

      <div className="flex justify-center gap-4 mb-8">
        <div className="px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold">
          ✓ Believe
        </div>
        <div className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-semibold">
          ✗ Bullsh*t
        </div>
      </div>

      <p className="text-lg text-gray-500">
        {voteCount} of {judgeCount} judges have voted
      </p>
    </div>
  );
}
