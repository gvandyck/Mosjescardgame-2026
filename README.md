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
2. Enable **Firestore Database** (start in test mode)
3. Enable **Anonymous Authentication** under Authentication → Sign-in method
4. Click the gear icon → Project Settings → scroll to "Your apps" → add a Web app
5. Copy the config object Firebase shows you
6. In this project, copy `firebase-config.EXAMPLE.js` → rename to `firebase-config.js`
7. Paste your config values into `firebase-config.js`

> ⚠️ `firebase-config.js` is in `.gitignore` — it will never be committed to GitHub.

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

Uploaded via FTP to: https://eightytwenty.nl/cardgame/

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
