import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import QRCode from "react-qr-code";
import { useState } from "react";

type LobbyProps = {
  roomId: Id<"rooms">;
  room: any;
};

export function Lobby({ roomId, room }: LobbyProps) {
  const players = useQuery(api.players.getPlayers, { roomId });
  const isHost = useQuery(api.rooms.isHost, { roomId });
  const updateRoomState = useMutation(api.rooms.updateRoomState);
  const setHotSeat = useMutation(api.rooms.setHotSeat);
  const setCurrentQuestion = useMutation(api.rooms.setCurrentQuestion);
  const removePlayer = useMutation(api.players.removePlayer);
  const getRandomQuestion = useQuery(api.questions.getRandomQuestion, {});
  const uploadQuestions = useMutation(api.questions.uploadQuestions);
  const clearAllQuestions = useMutation(api.questions.clearAllQuestions);
  const allQuestions = useQuery(api.questions.getAllQuestions);

  const [showAdmin, setShowAdmin] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const joinUrl = `${window.location.origin}?code=${room.code}`;
  const readyCount = players?.filter((p) => p.ready).length || 0;
  const canStart = (players?.length || 0) >= 1 && readyCount === players?.length;

  const handleStartGame = async () => {
    if (!canStart || !players) return;
    
    if (!getRandomQuestion) {
      alert("No questions available! Please upload questions first.");
      return;
    }

    try {
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      await setHotSeat({ roomId, playerId: randomPlayer._id });
      await setCurrentQuestion({ roomId, questionId: getRandomQuestion._id });
      await updateRoomState({ roomId, state: "QUESTION" });
    } catch (error: unknown) {
      console.error("Failed to start game:", error);
      alert("Failed to start game. Please try again.");
    }
  };

  const handleSetHotSeat = async (playerId: Id<"players">) => {
    if (!getRandomQuestion) {
      alert("No questions available! Please upload questions first.");
      return;
    }
    try {
      await setHotSeat({ roomId, playerId });
      await setCurrentQuestion({ roomId, questionId: getRandomQuestion._id });
      await updateRoomState({ roomId, state: "QUESTION" });
    } catch (error: unknown) {
      console.error("Failed to set hot seat:", error);
      alert("Failed to set hot seat. Please try again.");
    }
  };

  const handleRemovePlayer = async (playerId: Id<"players">) => {
    if (confirm("Remove this player from the game?")) {
      await removePlayer({ playerId });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus("Reading file...");
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        setUploadStatus("Error: JSON must be an array of questions");
        return;
      }

      setUploadStatus("Uploading questions...");
      const result = await uploadQuestions({ questions: data });
      setUploadStatus(
        `Success! Added ${result.successCount} questions. ${result.errorCount} errors.`
      );
    } catch (error) {
      setUploadStatus(`Error: ${error}`);
    }
  };

  const handleClearQuestions = async () => {
    if (confirm("Delete ALL questions from the database? This cannot be undone!")) {
      const result = await clearAllQuestions();
      setUploadStatus(`Deleted ${result.deletedCount} questions`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h2 className="text-3xl font-bold text-primary">Scan to Join</h2>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <QRCode value={joinUrl} size={200} />
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-2">Room Code</p>
            <p className="text-5xl font-bold text-primary tracking-wider">
              {room.code}
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">
              Players ({players?.length || 0})
            </h3>
            {isHost && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                {showAdmin ? "Hide Admin" : "Admin"}
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-96">
            {players?.map((player) => (
              <div
                key={player._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{player.emoji || "👤"}</span>
                  <span className="font-semibold">{player.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {player.ready ? (
                    <span className="text-green-600 font-semibold">✓ Ready</span>
                  ) : (
                    <span className="text-gray-400">Waiting...</span>
                  )}
                  {isHost && showAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSetHotSeat(player._id)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        title="Set as hot seat"
                      >
                        🎤
                      </button>
                      <button
                        onClick={() => handleRemovePlayer(player._id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        title="Remove player"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isHost && showAdmin && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <h4 className="font-bold text-sm">Question Management</h4>
              <p className="text-xs text-gray-600">
                Total Questions: {allQuestions?.length || 0}
              </p>
              <div className="space-y-2">
                <label className="block">
                  <span className="text-sm font-semibold">Upload JSON:</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="block w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
                  />
                </label>
                <button
                  onClick={handleClearQuestions}
                  className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Clear All Questions
                </button>
              </div>
              {uploadStatus && (
                <p className="text-xs text-gray-700 bg-white p-2 rounded">
                  {uploadStatus}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 space-y-2">
            <p className="text-sm text-gray-600">
              {readyCount} of {players?.length || 0} players ready
            </p>
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className="w-full px-6 py-4 bg-primary text-white font-bold text-xl rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canStart ? "Start Game ▶" : "Waiting for players..."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
