import React, { useMemo, useEffect } from "react";
import { logEvent } from "firebase/analytics";
import { analytics } from "../config/firebase";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

const PointsTable = ({
  players,
  roundsHistory,
  currentRound,
  totalRounds,
  gameOver,
}) => {
  // Add debugging
  // useEffect(() => {
  //   console.log("PointsTable received new roundsHistory:", roundsHistory);
  // }, [roundsHistory]);
  // Add to useEffect in PointsTable:
  useEffect(() => {
    if (gameOver) {
      logEvent(analytics, "view_results", {
        final_scores: players.map((p) => `${p.name}: ${p.points}`),
      });
    }
  }, [gameOver, players]);
  // Compute total scores with null check
  const totalScores = useMemo(() => {
    if (!roundsHistory || !Array.isArray(roundsHistory)) {
      console.log("Invalid roundsHistory:", roundsHistory);
      return {};
    }

    return players.reduce((totals, player) => {
      totals[player.name] = roundsHistory.reduce((sum, round) => {
        const points = round[player.name];
        return sum + (typeof points === "number" ? points : 0);
      }, 0);
      return totals;
    }, {});
  }, [roundsHistory, players]);

  // Define table columns
  const columns = useMemo(
    () =>
      players.map((player) => ({
        header: player.name,
        accessorKey: player.name,
        cell: (info) => info.getValue() ?? 0, // Handle null/undefined values
      })),
    [players]
  );

  // Prepare table data with validation
  const data = useMemo(() => {
    if (!roundsHistory || !Array.isArray(roundsHistory)) {
      return [
        players.reduce((obj, player) => {
          obj[player.name] = 0;
          return obj;
        }, {}),
      ];
    }

    const roundsData = roundsHistory.map((round) =>
      players.reduce((obj, player) => {
        obj[player.name] = round[player.name] ?? 0;
        return obj;
      }, {})
    );

    // Only add total row if NOT in final completed state
    const shouldShowTotal =
      currentRound <= totalRounds ||
      !(currentRound === totalRounds && roundsHistory.length === totalRounds);

    if (shouldShowTotal) {
      const totalRow = players.reduce((obj, player) => {
        obj[player.name] = totalScores[player.name] ?? 0;
        return obj;
      }, {});
      return [...roundsData, totalRow];
    }

    return roundsData;
  }, [roundsHistory, players, totalScores, currentRound, totalRounds]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg w-full">
      <h2 className="text-center text-lg font-bold text-yellow-400 mb-4">
        Points Table
      </h2>
      <table className="w-full border-collapse border border-yellow-400 text-center">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-yellow-500 text-gray-900">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-2 border border-yellow-400">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIndex) => (
            <tr
              key={row.id}
              className={`border border-yellow-400 ${
                rowIndex === (roundsHistory?.length || 0)
                  ? "bg-yellow-600 text-gray-900 font-bold"
                  : ""
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-2 border border-yellow-400">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {gameOver && roundsHistory?.length >= totalRounds && (
        <div className="mt-4 text-center animate-fade-in">
          <div className="bg-yellow-500 text-gray-900 p-4 rounded-lg inline-block">
            <h3 className="text-xl font-bold mb-2">
              {Object.values(totalScores).length > 1 &&
              new Set(Object.values(totalScores)).size === 1
                ? "🏆 Game Over - It's a Tie! 🏆"
                : "🏆 Game Over - We Have a Winner! 🏆"}
            </h3>
            <p className="text-lg">
              {(() => {
                console.log("[DEBUG] Calculating winner...");
                const maxScore = Math.max(...Object.values(totalScores));
                const winners = Object.entries(totalScores)
                  .filter(([_, score]) => score === maxScore)
                  .map(([name]) => name);

                return winners.length > 1
                  ? `${winners.join(" and ")} tied with ${maxScore} points!`
                  : `${winners[0]} wins with ${maxScore} points!`;
              })()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsTable;
