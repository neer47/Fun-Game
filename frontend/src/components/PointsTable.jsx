import React, { useMemo, useEffect } from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";

const PointsTable = ({ players, roundsHistory }) => {
  // Add debugging
  useEffect(() => {
    console.log("PointsTable received new roundsHistory:", roundsHistory);
  }, [roundsHistory]);

  // Compute total scores with null check
  const totalScores = useMemo(() => {
    if (!roundsHistory || !Array.isArray(roundsHistory)) {
      console.log("Invalid roundsHistory:", roundsHistory);
      return {};
    }

    return players.reduce((totals, player) => {
      totals[player.name] = roundsHistory.reduce((sum, round) => {
        const points = round[player.name];
        return sum + (typeof points === 'number' ? points : 0);
      }, 0);
      return totals;
    }, {});
  }, [roundsHistory, players]);

  // Define table columns
  const columns = useMemo(
    () => players.map(player => ({
      header: player.name,
      accessorKey: player.name,
      cell: info => info.getValue() ?? 0 // Handle null/undefined values
    })),
    [players]
  );

  // Prepare table data with validation
  const data = useMemo(() => {
    if (!roundsHistory || !Array.isArray(roundsHistory)) {
      return [players.reduce((obj, player) => {
        obj[player.name] = 0;
        return obj;
      }, {})];
    }

    const roundsData = roundsHistory.map(round =>
      players.reduce((obj, player) => {
        obj[player.name] = round[player.name] ?? 0;
        return obj;
      }, {})
    );

    // Add the total row
    const totalRow = players.reduce((obj, player) => {
      obj[player.name] = totalScores[player.name] ?? 0;
      return obj;
    }, {});

    return [...roundsData, totalRow];
  }, [roundsHistory, players, totalScores]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg w-full">
      <h2 className="text-center text-lg font-bold text-yellow-400 mb-4">Points Table</h2>
      <table className="w-full border-collapse border border-yellow-400 text-center">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="bg-yellow-500 text-gray-900">
              {headerGroup.headers.map(header => (
                <th key={header.id} className="p-2 border border-yellow-400">
                  {flexRender(header.column.columnDef.header, header.getContext())}
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
                rowIndex === (roundsHistory?.length || 0) ? "bg-yellow-600 text-gray-900 font-bold" : ""
              }`}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="p-2 border border-yellow-400">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PointsTable;