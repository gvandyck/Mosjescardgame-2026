// firebase-config.EXAMPLE.js
// =============================================
// THIS FILE IS SAFE TO COMMIT — it contains NO real keys.
// It is a template showing what firebase-config.js should look like.
//
// HOW TO USE:
// 1. Copy this file and rename the copy to: firebase-config.js
// 2. Fill in your real Firebase project values below
// 3. firebase-config.js is in .gitignore and will NEVER be uploaded to GitHub
// =============================================

export const firebaseConfig = {
  apiKey:            "YOUR_API_KEY_HERE",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
  // Required for Realtime Database multiplayer sync
  databaseURL:       "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/"
};
