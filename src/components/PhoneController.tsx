import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

type PhoneControllerProps = {
  joinCode?: string;
};

export function PhoneController({ joinCode }: PhoneControllerProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("👤");
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);

  const room = useQuery(
    api.rooms.getRoomByCode,
    joinCode ? { code: joinCode } : "skip"
  );
  const player = useQuery(
    api.players.getPlayer,
    playerId ? { playerId } : "skip"
  );
  const currentRoom = useQuery(
    api.rooms.getRoom,
    roomId ? { roomId } : "skip"
  );

  const joinRoom = useMutation(api.players.joinRoom);
  const toggleReady = useMutation(api.players.toggleReady);

  useEffect(() => {
    if (room && !roomId) {
      setRoomId(room._id);
    }
  }, [room, roomId]);

  const handleJoin = async () => {
    if (!name || !roomId) return;
    try {
      const id = await joinRoom({ roomId, name, emoji });
      setPlayerId(id);
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Failed to join room. Please try again.");
    }
  };

  const handleToggleReady = async () => {
    if (!playerId) return;
    try {
      await toggleReady({ playerId });
    } catch (error) {
      console.error("Failed to toggle ready:", error);
      alert("Failed to update ready status. Please try again.");
    }
  };

  if (!joinCode) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">No Room Code</h2>
        <p className="text-gray-600">
          Please use a link with a room code to join a game, or scan the QR code from the main monitor.
        </p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-md mx-auto p-6">
        <p className="text-center text-gray-600">Loading room...</p>
      </div>
    );
  }

  if (!playerId) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Join Game</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Pick an Emoji</label>
            <div className="grid grid-cols-6 gap-2">
              {["👤", "😀", "😎", "🤓", "🥳", "🤠", "🧐", "😈", "👻", "🤖", "👽", "🦄"].map(
                (e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`text-3xl p-2 rounded ${
                      emoji === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-gray-100"
                    }`}
                  >
                    {e}
                  </button>
                )
              )}
            </div>
          </div>
          <button
            onClick={handleJoin}
            disabled={!name}
            className="w-full px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            Join Game
          </button>
        </div>
      </div>
    );
  }

  if (!currentRoom || !player) {
    return <div>Loading...</div>;
  }

  // Show eliminated screen if player was eliminated
  if (player.eliminated) {
    const winnings = player.lastSafeHaven >= 0 
      ? (currentRoom?.settings.ladder[player.lastSafeHaven] || 0)
      : 0;
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="mb-6">
          <div className="text-8xl mb-4">💀</div>
          <h2 className="text-3xl font-bold text-red-600 mb-2">You've Been Eliminated!</h2>
          <p className="text-xl text-gray-600">
            You're taking home ${winnings.toLocaleString()}
          </p>
        </div>
        <p className="text-gray-500">
          Thanks for playing! Watch the main screen to see who wins.
        </p>
      </div>
    );
  }

  if (currentRoom.state === "LOBBY") {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <span className="text-6xl mb-4 block">{player.emoji}</span>
          <h2 className="text-2xl font-bold">{player.name}</h2>
        </div>
        <button
          onClick={handleToggleReady}
          className={`w-full px-6 py-4 font-bold text-xl rounded-lg transition-colors ${
            player.ready
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {player.ready ? "✓ Ready!" : "Tap to Ready"}
        </button>
        <p className="text-center text-gray-600 mt-4">
          Waiting for game to start...
        </p>
      </div>
    );
  }

  if (currentRoom.state === "QUESTION" && currentRoom.hotSeatPlayerId === playerId) {
    return <HotSeatQuestion roomId={roomId!} room={currentRoom} playerId={playerId} />;
  }

  if (currentRoom.state === "VOTE" && currentRoom.hotSeatPlayerId !== playerId) {
    return <JudgeVote roomId={roomId!} room={currentRoom} playerId={playerId} />;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      <p className="text-xl text-gray-600">Watch the main screen...</p>
    </div>
  );
}

function HotSeatQuestion({
  roomId,
  room,
  playerId,
}: {
  roomId: Id<"rooms">;
  room: any;
  playerId: Id<"players">;
}) {
  const question = useQuery(
    api.questions.getQuestion,
    room.currentQuestionId ? { questionId: room.currentQuestionId } : "skip"
  );
  const answer = useQuery(
    api.game.getAnswer,
    room.currentQuestionId
      ? { roomId, questionId: room.currentQuestionId, playerId }
      : "skip"
  );
  const submitAnswer = useMutation(api.game.submitAnswer);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean } | null>(null);

  if (!question) return <div>Loading...</div>;

  if (answer || result) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="mb-6">
          {(answer?.isCorrect || result?.isCorrect) ? (
            <>
              <div className="text-8xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-green-600">You're RIGHT!</h2>
            </>
          ) : (
            <>
              <div className="text-8xl mb-4">❌</div>
              <h2 className="text-3xl font-bold text-red-600">You're WRONG!</h2>
            </>
          )}
        </div>
        <p className="text-xl text-gray-600">Now convince the judges...</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (selectedIndex === null) return;
    try {
      const res = await submitAnswer({
        roomId,
        questionId: question._id,
        playerId,
        choiceIndex: selectedIndex,
      });
      setResult(res);
    } catch (error) {
      console.error("Failed to submit answer:", error);
      alert("Failed to submit answer. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
          {question.category}
        </span>
        <h2 className="text-xl font-bold mt-4">{question.questionText}</h2>
      </div>

      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`w-full p-4 rounded-lg text-left transition-colors ${
              selectedIndex === index
                ? "bg-primary text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <span className="font-bold mr-2">
              {String.fromCharCode(65 + index)}
            </span>
            {option}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedIndex === null}
        className="w-full px-6 py-4 bg-primary text-white font-bold text-xl rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
      >
        Lock Answer
      </button>
    </div>
  );
}

function JudgeVote({
  roomId,
  room,
  playerId,
}: {
  roomId: Id<"rooms">;
  room: any;
  playerId: Id<"players">;
}) {
  const question = useQuery(
    api.questions.getQuestion,
    room.currentQuestionId ? { questionId: room.currentQuestionId } : "skip"
  );
  const votes = useQuery(
    api.game.getVotes,
    room.currentQuestionId
      ? { roomId, questionId: room.currentQuestionId }
      : "skip"
  );
  const submitVote = useMutation(api.game.submitVote);

  const [voted, setVoted] = useState(false);

  const hasVoted = votes?.some((v) => v.judgeId === playerId);

  if (!question) return <div>Loading...</div>;

  if (voted || hasVoted) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold">Vote Locked!</h2>
        <p className="text-gray-600 mt-2">Waiting for reveal...</p>
      </div>
    );
  }

  const handleVote = async (vote: "believe" | "bullshit") => {
    try {
      await submitVote({
        roomId,
        questionId: question._id,
        judgeId: playerId,
        vote,
      });
      setVoted(true);
    } catch (error) {
      console.error("Failed to submit vote:", error);
      alert("Failed to submit vote. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Cast Your Vote</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-lg">{question.questionText}</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleVote("believe")}
          className="w-full px-6 py-6 bg-green-600 text-white font-bold text-2xl rounded-lg hover:bg-green-700 transition-colors"
        >
          ✓ Believe
        </button>
        <button
          onClick={() => handleVote("bullshit")}
          className="w-full px-6 py-6 bg-red-600 text-white font-bold text-2xl rounded-lg hover:bg-red-700 transition-colors"
        >
          ✗ Bullsh*t
        </button>
      </div>
    </div>
  );
}
