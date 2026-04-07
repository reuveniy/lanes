# Star Lanes

A multiplayer interstellar commerce game. Players take turns placing markers on a grid to form and expand shipping companies, then buy and sell stock. The player with the highest net worth at the end wins.

Based on the original 1985 GW-BASIC game by E. Haddad.

## Prerequisites

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Development

Start the server (includes Vite dev middleware for hot reload):

```bash
npm run dev
```

Open http://localhost:3001 in your browser. Both the UI and WebSocket run on the same port.

## Production

Build the client and start the server:

```bash
npm run build
npm start
```

The server serves the built client from `dist/` and runs on port 3001 (or `PORT` env var).

## Docker

Build and run:

```bash
docker build -t starlanes .
docker run -p 3001:3001 \
  -e GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com \
  -v starlanes-data:/app/data \
  starlanes
```

Or with docker-compose:

```bash
export GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
docker compose up -d
```

`GOOGLE_CLIENT_ID` is required — the same value used in the Google Cloud Console for your OAuth credentials. Game data (rooms, leaderboard) is persisted in the `/app/data` volume.

### Push to Docker Hub

```bash
docker build -t yosephr/starlanes .
docker push yosephr/starlanes
```

### Pull and run from Docker Hub

```bash
docker run -p 3001:3001 \
  -e GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com \
  -v starlanes-data:/app/data \
  yosephr/starlanes
```

## Google Authentication (Online Play)

Online multiplayer requires a Google OAuth Client ID:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add your domain to Authorized JavaScript origins (e.g. `http://localhost:5173` for dev)
4. Set the client ID:

```bash
export GOOGLE_CLIENT_ID=your-client-id-here
npm run dev
```

Or hardcode it in `server/auth.ts` for development.

Without `GOOGLE_CLIENT_ID`, the server accepts any token (dev mode).

## Storybook

View all UI components in isolation:

```bash
npm run storybook
```

Open http://localhost:6006.

## Game Modes

| Mode | Description |
|------|-------------|
| **Play Local** | Single-browser game, 2-6 players sharing one screen |
| **Watch Demo** | AI plays a full game automatically with speed controls |
| **Play Online** | Multiplayer via WebSocket. Create a room, share the 4-letter code |
| **Observe** | Watch any online game in real-time (no login required) |

## Online Play

1. Sign in with Google on the home screen
2. Click **Create Online Game** to get a room code
3. Share the code with other players
4. Other players sign in and click **Join** on the room from the list (or enter the code in the lobby)
5. Host configures star count and game steps, then starts the game
6. Players take turns in their own browser

### Reconnection

- If you disconnect, the game auto-reconnects and re-joins your room
- Game state is persisted to disk (`data/rooms.json`) so games survive server restarts
- Players rejoin by signing in with the same Google account

## Leaderboard

- Wins from online games are tracked per player
- Persisted locally (`data/leaderboard.json`) and remotely
- Visible on the home screen for all visitors

## Project Structure

```
server/           # Node.js game server
  index.ts        # Express + WebSocket entry point
  rooms.ts        # Room management (create, join, reconnect)
  gameSession.ts  # Authoritative game state + reducer
  auth.ts         # Google OAuth token verification
  leaderboard.ts  # Win tracking + remote persistence
  persist.ts      # File-based state persistence
  protocol.ts     # Client-server message types

src/
  engine/         # Pure game logic (no React)
    rng.ts        # Seeded random number generator
    mapGenerator.ts
    neighbors.ts
    companies.ts
    mergers.ts
    events.ts
    economy.ts
    trading.ts
    moveGeneration.ts
    placement.ts
    ai.ts         # AI for demo mode
    sound.ts      # Web Audio API sound effects

  state/          # React state management
    reducer.ts    # Game reducer (useReducer)
    actions.ts
    initialState.ts

  types/
    game.ts       # All game types

  hooks/
    useMultiplayerGame.ts  # WebSocket hook

  components/     # React UI
    HomeScreen.tsx
    LobbyScreen.tsx
    GameView.tsx
    GameBoard.tsx  # Presentational (Storybook)
    GameMap.tsx
    SetupScreen.tsx
    TradingPanel.tsx
    HoldingsPanel.tsx
    HoldingsScreen.tsx
    NetWorthPanel.tsx
    CashDisplay.tsx
    StepCounter.tsx
    MessageArea.tsx
    MoveSelector.tsx
    GameOverScreen.tsx
    DemoMode.tsx
    RoomList.tsx
    Leaderboard.tsx
    GoogleLogin.tsx

  stories/        # Storybook stories for all components

original/
  lanes16.bas     # Original GW-BASIC source
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `GOOGLE_CLIENT_ID` | For online play | Google OAuth Client ID |
| `SSL_CERT` | No | Path to SSL certificate file (enables HTTPS) |
| `SSL_KEY` | No | Path to SSL private key file |
| `SSL_PASSPHRASE` | No | Passphrase for encrypted SSL key |
| `HTTP_PORT` | No | HTTP redirect port when SSL enabled (default: 80) |

### HTTPS

To enable HTTPS, provide SSL certificate and key files:

```bash
SSL_CERT=/path/to/cert.pem SSL_KEY=/path/to/key.pem npm start
```

If your key is encrypted with a passphrase:

```bash
SSL_PASSPHRASE=yourpass SSL_CERT=/path/to/cert.pem SSL_KEY=/path/to/key.pem npm start
```

Or decrypt the key first:

```bash
openssl rsa -in key.pem -out key-decrypted.pem
```

With Docker:

```bash
docker run -p 443:3001 \
  -e GOOGLE_CLIENT_ID=your-id \
  -e SSL_CERT=/app/certs/cert.pem \
  -e SSL_KEY=/app/certs/key.pem \
  -v /path/to/certs:/app/certs:ro \
  -v starlanes-data:/app/data \
  yosephr/starlanes
```


ref: [Goggle Client ID Dashboard](https://console.cloud.google.com/apis/credentials?project=chrome-setup-138521)

