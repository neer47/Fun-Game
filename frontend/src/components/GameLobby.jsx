import React, { useContext, useState, useEffect } from "react";
import { GameContext } from "../context/GameContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ref, onValue, update } from 'firebase/database';
import { db, analytics } from "../config/firebase";
import { ToastContainer, toast } from 'react-toastify';
import { setUserProperties, logEvent } from "firebase/analytics";
import 'react-toastify/dist/ReactToastify.css';

const GameLobby = () => {
  const { 
    playerName,
    setPlayerName,
    roomLink,
    createRoom,
    joinRoom,
    isCreatingRoom,
    setGameSessionId,
    gameSessionId,
    setPlayers,
    players,
  } = useContext(GameContext);
  const [inviteLink, setInviteLink] = useState("");
  const [rounds, setRounds] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const isJoiningViaLink = location.search.includes('join=');
  const roomId = new URLSearchParams(location.search).get('join');

  const incrementRounds = () => {
    if (rounds < 10) setRounds(rounds + 1);
  };

  const decrementRounds = () => {
    if (rounds > 1) setRounds(rounds - 1);
  };

  const handleCreateRoom = async () => {
    logEvent(analytics, 'create_room', { player_name: playerName });
    if (!playerName.trim()) {
      toast.error("Please enter your name first!");
      return;
    }
    const sessionId = await createRoom();
    if (sessionId) {
      setGameSessionId(sessionId);
      setUserProperties(analytics, {
        player_name: playerName,
        game_mode: 'multi', // Assuming creating a room is for multiplayer
        rounds_played: rounds
      });
    }
  };

  const handleJoinRoom = async () => {
    logEvent(analytics, 'join_room', { player_name: playerName });
    if (!playerName.trim()) {
      toast.error("Please enter your name first!");
      return;
    }
    const sessionId = await joinRoom(roomId);
    if (sessionId) {
      setGameSessionId(sessionId);
      setUserProperties(analytics, {
        player_name: playerName,
        game_mode: 'multi', // Assuming joining a room is always multiplayer
        rounds_played: rounds
      });
    }
  };

  const handleStartMultiplayerGame = async () => {
    logEvent(analytics, 'game_start', {
      game_type: 'multiplayer',
      player_count: players.length,
      rounds: rounds
    });
    if (players.length === 4) {
      try {
        console.log('Starting game with players:', players);
        // Update game status in Firebase before navigating
        const gameRef = ref(db, `games/${gameSessionId}`);

        await update(gameRef, {
          status: 'playing',
          startedAt: new Date().toISOString(),
          totalRounds: rounds,
          players: players,
          gameStarted: false,
          roundCompleted: false,
          mantriSelected: false,
          timeLeft: 30,
          flippedIndexes: []
        });

        navigate("/multiplayer/game", {
          state: {
            sessionId: gameSessionId,
            players: players,
            gameMode: 'multi',
            gameSettings: {
              totalRounds: rounds,
              playerCount: 4
            },
            rounds: rounds
          }
        });
      } catch (error) {
        console.error("Error starting game:", error);
        toast.error("Failed to start game. Please try again.");
      }
    } else {
      toast.warn("Need 4 players to start the game!");
    }
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
      } catch (err) {
        console.error("Clipboard API failed, using fallback...", err);
        copyToClipboardFallback(text);
      }
    } else {
      copyToClipboardFallback(text);
    }
  };
  

  useEffect(() => {
    if (gameSessionId) {
      // Subscribe to players updates
      const gameRef = ref(db, `games/${gameSessionId}`);
      const unsubscribe = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const gameData = snapshot.val();
          console.log('Lobby received game data:', gameData);
          setPlayers(gameData.players || []);
          
          // If game has started, navigate non-host players to game
          const isHost = gameData.players?.some(p => p.isHost && p.name === playerName);
          if (gameData.status === 'playing' && !isHost) {
            console.log('Non-host navigating with players:', gameData.players);
            navigate("/multiplayer/game", {
              state: {
                sessionId: gameSessionId,
                players: gameData.players,
                gameMode: 'multi',
                gameSettings: {
                  totalRounds: gameData.totalRounds,
                  playerCount: 4
                },
                rounds: gameData.totalRounds
              }
            });
          }
        }
      });

      return () => unsubscribe();
    }
  }, [gameSessionId, playerName, navigate]);

  // Debug log for players state changes
  useEffect(() => {
    console.log('Players updated:', players);
  }, [players]);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleNameChange = (e) => {
    let name = e.target.value.trim(); // Trim white spaces
    const validName = /^[a-zA-Z\s]*$/.test(name); // Only allow letters and spaces
    const maxLength = 20; // Set character limit

    if (name.length > maxLength) {
      toast.error(`Name cannot exceed ${maxLength} characters.`);
      return;
    }

    if (validName) {
      setPlayerName(capitalizeFirstLetter(name));
    } else {
      toast.error("Name can only contain letters and spaces.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
        Raja Mantri Chor Sipahi
      </h1>
      <div className="bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-gray-100 mb-6">
          {isJoiningViaLink ? "Join Game" : "Create Game"}
        </h2>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={handleNameChange}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-yellow-400 mb-4"
          />

          {roomLink ? (
            <div className="space-y-4">
              <p className="text-gray-300">Share this link with other players:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={roomLink}
                  readOnly
                  className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-md"
                />
                <button
                  onClick={() => copyToClipboard(roomLink)}
                  className="px-4 py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Waiting for other players to join...
              </p>
            </div>
          ) : isJoiningViaLink ? (
            <div className="space-y-4">
              <button
                onClick={handleJoinRoom}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition"
              >
                Join Game
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleCreateRoom}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition"
              >
                Create Room
              </button>
            </div>
          )}
        </div>

        {players.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg text-gray-300 mb-2">Players in Room:</h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div key={index} className="flex items-center text-gray-300">
                  <span>{player.name}</span>
                  {player.isHost && (
                    <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
            {players.some(p => p.isHost && p.name === playerName) && (
              <>
                <div className="mt-6 mb-4">
                  <label className="block text-gray-200 font-medium mb-2">
                    Select Number of Rounds
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={decrementRounds}
                      aria-label="Decrement Rounds"
                      className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={rounds === 1}
                    >
                      -
                    </button>
                    <span className="text-xl text-gray-100 font-bold">{rounds}</span>
                    <button
                      onClick={incrementRounds}
                      aria-label="Increment Rounds"
                      className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={rounds === 10}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleStartMultiplayerGame}
                  className={`w-full mt-4 py-3 rounded-lg transition ${
                    players.length === 4
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={players.length !== 4}
                >
                  {players.length === 4 ? 'Start Game' : `Waiting for ${4 - players.length} more players...`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default GameLobby; 
