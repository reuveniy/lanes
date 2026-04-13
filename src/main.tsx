import { createRoot } from "react-dom/client";
import { useState } from "react";
import { GameView } from "./components/GameView";
import { LobbyScreen } from "./components/LobbyScreen";
import { HomeScreen } from "./components/HomeScreen";
import { DemoMode } from "./components/DemoMode";
import { HelpScreen } from "./components/HelpScreen";
import { ReplayView } from "./components/ReplayView";
import { useMultiplayerGame } from "./hooks/useMultiplayerGame";

type Screen = "home" | "lobby" | "game-local" | "demo" | "observing" | "help" | "replay";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const isOnline = screen !== "game-local";
  const mp = useMultiplayerGame(isOnline);

  // Auto-transition: lobby → game when server sends game state
  if (
    screen === "lobby" &&
    mp.state.phase !== "setup" &&
    mp.state.players.length > 0
  ) {
    return (
      <GameView
        state={mp.state}
        dispatch={mp.dispatch}
        playerId={mp.playerId}
        roomCode={mp.roomCode}
        connected={mp.connected}
        mapVotes={mp.mapVotes}
        onMapVote={mp.voteMap}
        endGameVotes={mp.endGameVotes}
        endGameInitiator={mp.endGameInitiator}
        onEndGameVote={mp.voteEndGame}
        stepsVote={mp.stepsVote}
        onStepsVote={mp.voteSteps}
        onExit={() => setScreen("home")}
      />
    );
  }

  // Auto-transition: observing → show game as observer
  if (
    screen === "observing" &&
    mp.observing &&
    mp.state.phase !== "setup" &&
    mp.state.grid.length > 0
  ) {
    return (
      <GameView
        state={mp.state}
        dispatch={mp.dispatch}
        playerId={-1}
        roomCode={mp.roomCode}
        connected={mp.connected}
        onExit={() => setScreen("home")}
      />
    );
  }

  switch (screen) {
    case "home":
      return (
        <HomeScreen
          connected={mp.connected}
          authenticated={mp.authenticated}
          user={mp.user}
          googleClientId={mp.googleClientId}
          error={mp.error}
          roomList={mp.roomList}
          leaderboard={mp.leaderboard}
          onPlayLocal={() => setScreen("game-local")}
          onWatchDemo={() => setScreen("demo")}
          onHelp={() => setScreen("help")}
          onCreateRoom={(maxPlayers, starCount, totalSteps, doublePayCount, fogOfWar) => {
            mp.createRoom(maxPlayers, starCount, totalSteps, doublePayCount, fogOfWar);
            setScreen("lobby");
          }}
          onJoinRoom={(code) => {
            mp.joinRoom(code);
            setScreen("lobby");
          }}
          onObserveRoom={(code) => {
            mp.observeRoom(code);
            setScreen("observing");
          }}
          onAuthenticate={mp.authenticate}
          onRefreshRooms={mp.listRooms}
          isAdmin={mp.isAdmin}
          onClearLeaderboard={mp.clearLeaderboard}
          onRemoveLeaderboardUser={mp.removeLeaderboardUser}
          onDeleteRoom={mp.deleteRoom}
          onDeleteGameLog={mp.deleteGameLog}
          gameLogs={mp.gameLogs}
          onRefreshLogs={mp.listGameLogs}
          onReplay={(id) => { mp.getGameLog(id); setScreen("replay"); }}
        />
      );

    case "lobby":
      return (
        <LobbyScreen
          connected={mp.connected}
          roomCode={mp.roomCode}
          players={mp.players}
          maxPlayers={mp.maxPlayers}
          playerId={mp.playerId}
          error={mp.error}
          userName={mp.user?.name ?? null}
          onJoinRoom={mp.joinRoom}
          onStartNow={mp.startNow}
          onPlayLocal={() => setScreen("game-local")}
        />
      );

    case "observing":
      return (
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            background: "#0a0a1a",
            color: "#9ca3af",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          Connecting to room {mp.roomCode ?? "..."}
        </div>
      );

    case "game-local":
      return <GameView onExit={() => setScreen("home")} onSaveGameLog={mp.saveGameLog} />;

    case "demo":
      return <DemoMode onExit={() => setScreen("home")} />;

    case "help":
      return <HelpScreen onClose={() => setScreen("home")} />;

    case "replay":
      if (!mp.gameLogData) {
        return (
          <div style={{ fontFamily: "'Courier New', monospace", background: "#0a0a1a", color: "#9ca3af", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Loading game replay...
          </div>
        );
      }
      return <ReplayView log={mp.gameLogData} onExit={() => setScreen("home")} />;
  }
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
