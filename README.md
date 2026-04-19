# MOSJES — Card Game

A browser-based multiplayer trading card game. Dark arcade meets Dutch friend group.
Built with plain HTML, CSS, and JavaScript. No frameworks, no build tools.

---

## 🚀 How to run locally

1. Install **VS Code** — https://code.visualstudio.com/
2. Install the **Live Server** extension in VS Code
3. Open this project folder in VS Code
4. Right-click `index.html` → **Open with Live Server**
5. The game opens in your browser at `http://127.0.0.1:5500`

---

## 🔥 Firebase Setup (for multiplayer)

1. Go to https://console.firebase.google.com/ and create a free project
2. Enable **Realtime Database** (start in test mode) — note the database URL shown (e.g. `https://your-project-default-rtdb.firebaseio.com/`)
3. Enable **Anonymous Authentication** under Authentication → Sign-in method
4. Click the gear icon → Project Settings → scroll to "Your apps" → add a Web app
5. Copy the config object Firebase shows you
6. In this project, copy `firebase-config.EXAMPLE.js` → rename to `firebase-config.js`
7. Paste your config values into `firebase-config.js`, including the `databaseURL` field

> ⚠️ `firebase-config.js` is in `.gitignore` — it will never be committed to GitHub.

> ℹ️ Multiplayer uses Firebase **Realtime Database** (not Firestore). Firestore's WebSocket transport is blocked by some ad blockers; RTDB uses a different path that works reliably.

---

## 📁 Project Structure

```
index.html          — Lobby: enter name, pick deck, create/join room
game.html           — Game board: the actual card game

styles/
  main.css          — Global styles, fonts, CSS variables
  board.css         — Game board grid layout
  cards.css         — Card visuals and animations

src/
  main.js           — App entry point
  firebase.js       — Firebase connection
  data/             — Card definitions (no logic, just data)
  abilities/        — Card effect functions
  engine/           — Game rules (no visuals)
  multiplayer/      — Firebase room sync
  ui/               — HTML rendering

assets/
  mosje-art/        — Character images
  card-backs/       — Card back images
  icons/            — Trait icons
```

---

## 🌐 Hosting

Deployed via Firebase Hosting: https://card-game-2026.web.app

---

## 🔀 Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — only merge tested code here |
| `dev` | Active development |
| `feature/xxx` | One branch per new feature |
| `hotfix/xxx` | Quick fixes to production |

---

## 📦 Release History

See [CHANGELOG.md](CHANGELOG.md)
