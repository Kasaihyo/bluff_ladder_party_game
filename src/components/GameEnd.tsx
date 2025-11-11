import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type GameEndProps = {
  roomId: Id<"rooms">;
  room: any;
};

export function GameEnd({ roomId, room }: GameEndProps) {
  const players = useQuery(api.players.getPlayers, { roomId });

  if (!players) {
    return <div>Loading...</div>;
  }

  // Sort players by their current rung (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.currentRung - a.currentRung);
  const winner = sortedPlayers[0];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold text-primary mb-4">🏆 Game Over! 🏆</h1>
        {winner && (
          <div className="mb-8">
            <div className="text-8xl mb-4">{winner.emoji || "👤"}</div>
            <h2 className="text-4xl font-bold mb-2">{winner.name} WINS!</h2>
            <p className="text-3xl text-green-600 font-bold">
              ${(winner.currentRung >= 0 && winner.currentRung < room.settings.ladder.length 
                  ? room.settings.ladder[winner.currentRung] 
                  : 0).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">Final Standings</h3>
        <div className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <div
              key={player._id}
              className={`flex items-center justify-between p-4 rounded-lg ${
                index === 0
                  ? "bg-yellow-100 border-2 border-yellow-400"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-500">
                  #{index + 1}
                </span>
                <span className="text-3xl">{player.emoji || "👤"}</span>
                <span className="font-semibold text-lg">{player.name}</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">
                  ${(player.currentRung >= 0 && player.currentRung < room.settings.ladder.length
                      ? room.settings.ladder[player.currentRung]
                      : 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Judge Accuracy:{" "}
                  {player.totalVotes > 0
                    ? `${Math.round((player.correctReads / player.totalVotes) * 100)}%`
                    : "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-gray-600">
        <p>Thanks for playing Bluff Ladder!</p>
        <p className="text-sm mt-2">
          Refresh the page to start a new game
        </p>
      </div>
    </div>
  );
}

