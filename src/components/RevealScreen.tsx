import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect, useRef } from "react";

type RevealScreenProps = {
  roomId: Id<"rooms">;
  room: any;
};

export function RevealScreen({ roomId, room }: RevealScreenProps) {
  const question = useQuery(
    api.questions.getQuestion,
    room.currentQuestionId ? { questionId: room.currentQuestionId } : "skip"
  );
  const result = useQuery(
    api.game.calculateRoundResult,
    room.currentQuestionId
      ? { roomId, questionId: room.currentQuestionId }
      : "skip"
  );
  const players = useQuery(api.players.getPlayers, { roomId });
  const hotSeatPlayer = useQuery(
    api.players.getPlayer,
    room.hotSeatPlayerId ? { playerId: room.hotSeatPlayerId } : "skip"
  );
  const updatePlayerRung = useMutation(api.players.updatePlayerRung);
  const eliminatePlayer = useMutation(api.players.eliminatePlayer);
  const updateJudgeStats = useMutation(api.players.updateJudgeStats);
  const updateRoomState = useMutation(api.rooms.updateRoomState);
  const setHotSeat = useMutation(api.rooms.setHotSeat);
  const setCurrentQuestion = useMutation(api.rooms.setCurrentQuestion);
  const getRandomQuestion = useQuery(api.questions.getRandomQuestion, {});
  const processedRef = useRef(false);

  useEffect(() => {
    const processResult = async () => {
      if (!result || !hotSeatPlayer || !players || !getRandomQuestion) return;
      
      // Prevent double processing
      if (processedRef.current) return;
      processedRef.current = true;

      try {
        for (const vote of result.votes) {
          await updateJudgeStats({
            playerId: vote.judgeId,
            correctRead: vote.correctRead,
          });
        }

        if (result.shouldEliminate) {
          await eliminatePlayer({ playerId: hotSeatPlayer._id });
        } else if (result.shouldAdvance) {
          const newRung = hotSeatPlayer.currentRung + 1;
          const isSafeHaven = room.settings.safeHavens.includes(newRung);
          await updatePlayerRung({
            playerId: hotSeatPlayer._id,
            newRung,
            isSafeHaven,
          });
        }

        const timeoutId = setTimeout(async () => {
          try {
            const activePlayers = players.filter((p) => !p.eliminated);
            if (activePlayers.length === 0) {
              await updateRoomState({ roomId, state: "GAME_END" });
              return;
            }

            const nextHotSeat = activePlayers.reduce((best, p) => {
              const bestAccuracy = best.totalVotes > 0 ? best.correctReads / best.totalVotes : 0;
              const pAccuracy = p.totalVotes > 0 ? p.correctReads / p.totalVotes : 0;
              return pAccuracy > bestAccuracy ? p : best;
            });

            await setHotSeat({ roomId, playerId: nextHotSeat._id });
            await setCurrentQuestion({ roomId, questionId: getRandomQuestion._id });
            await updateRoomState({ roomId, state: "QUESTION" });
          } catch (error) {
            console.error("Failed to advance to next round:", error);
          }
        }, 5000);

        // Cleanup timeout on unmount
        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.error("Failed to process round result:", error);
        processedRef.current = false; // Allow retry on error
      }
    };

    processResult();
  }, [result, hotSeatPlayer, players, getRandomQuestion, roomId, updateJudgeStats, eliminatePlayer, updatePlayerRung, room.settings.safeHavens, updateRoomState, setHotSeat, setCurrentQuestion]);

  if (!question || !result || !hotSeatPlayer) {
    return <div>Loading...</div>;
  }

  const correctOption = question.options[question.correctIndex];
  const hotSeatChoice = question.options[result.answer.choiceIndex];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-4xl font-bold mb-8 text-center">The Reveal</h2>

      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <p className="text-xl mb-4">{question.questionText}</p>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-2xl">{hotSeatPlayer.emoji || "👤"}</span>
          <span className="font-bold">{hotSeatPlayer.name} answered:</span>
          <span className="text-xl font-semibold">{hotSeatChoice}</span>
          {result.answer.isCorrect ? (
            <span className="text-3xl">✅</span>
          ) : (
            <span className="text-3xl">❌</span>
          )}
        </div>
        <div className="p-4 bg-green-100 rounded">
          <p className="font-semibold text-green-800">
            Correct Answer: {correctOption}
          </p>
          <p className="text-sm text-green-700 mt-2">{question.explanation}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">Judge Votes</h3>
        <div className="grid grid-cols-2 gap-4">
          {result.votes.map((vote: any) => {
            const judge = players?.find((p) => p._id === vote.judgeId);
            return (
              <div
                key={vote._id}
                className={`p-4 rounded-lg ${
                  vote.correctRead ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{judge?.emoji || "👤"}</span>
                    <span className="font-semibold">{judge?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        vote.vote === "believe"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {vote.vote === "believe" ? "Believed" : "Called BS"}
                    </span>
                    {vote.correctRead && <span className="text-xl">⭐</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        {result.shouldEliminate ? (
          <div className="p-6 bg-red-100 rounded-lg">
            <p className="text-3xl font-bold text-red-700 mb-2">ELIMINATED!</p>
            <p className="text-lg">
              Taking home ${hotSeatPlayer.lastSafeHaven.toLocaleString()}
            </p>
          </div>
        ) : result.shouldAdvance ? (
          <div className="p-6 bg-green-100 rounded-lg">
            <p className="text-3xl font-bold text-green-700 mb-2">ADVANCE! 🎉</p>
            <p className="text-lg">
              {hotSeatPlayer.currentRung + 1 < room.settings.ladder.length 
                ? `Moving to $${room.settings.ladder[hotSeatPlayer.currentRung + 1].toLocaleString()}`
                : "Reached the top!"}
            </p>
          </div>
        ) : (
          <div className="p-6 bg-yellow-100 rounded-lg">
            <p className="text-2xl font-bold text-yellow-700">No Change</p>
          </div>
        )}
      </div>
    </div>
  );
}
