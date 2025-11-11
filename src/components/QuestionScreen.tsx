import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect, useState } from "react";

type QuestionScreenProps = {
  roomId: Id<"rooms">;
  room: any;
};

export function QuestionScreen({ roomId, room }: QuestionScreenProps) {
  const question = useQuery(
    api.questions.getQuestion,
    room.currentQuestionId ? { questionId: room.currentQuestionId } : "skip"
  );
  const hotSeatPlayer = useQuery(
    api.players.getPlayer,
    room.hotSeatPlayerId ? { playerId: room.hotSeatPlayerId } : "skip"
  );
  const answer = useQuery(
    api.game.getAnswer,
    room.currentQuestionId && room.hotSeatPlayerId
      ? {
          roomId,
          questionId: room.currentQuestionId,
          playerId: room.hotSeatPlayerId,
        }
      : "skip"
  );
  const updateRoomState = useMutation(api.rooms.updateRoomState);

  const [timeLeft, setTimeLeft] = useState(room.settings.answerTime);

  useEffect(() => {
    if (answer) {
      updateRoomState({ roomId, state: "STORY" }).catch((error) => {
        console.error("Failed to update room state:", error);
      });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          updateRoomState({ roomId, state: "STORY" }).catch((error) => {
            console.error("Failed to update room state:", error);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [answer, roomId, updateRoomState]);

  if (!question || !hotSeatPlayer) {
    return <div>Loading question...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold">
            {question.category}
          </span>
          <span className="text-2xl">{hotSeatPlayer.emoji || "👤"}</span>
          <span className="text-xl font-bold">{hotSeatPlayer.name}</span>
          <span className="text-gray-600">is in the hot seat</span>
        </div>
        <div className="text-3xl font-bold text-primary">{timeLeft}s</div>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6">{question.questionText}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {question.options.map((option, index) => (
          <div
            key={index}
            className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-xl">{option}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-gray-600">
        Waiting for {hotSeatPlayer.name} to lock their answer...
      </div>
    </div>
  );
}
