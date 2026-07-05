// ==========================================================================
// Firebase configuration for Among The Woods multiplayer (future feature).
// This is the SAME Firebase project as era-battle — the Realtime Database is
// shared. Among The Woods rooms are namespaced under  games/woods-<CODE>  so
// they can never collide with era-battle rooms (4-char codes) and the existing
// security rules ("games" read/write) already cover them.
// ==========================================================================

export const firebaseConfig = {
    apiKey: "AIzaSyAYuu5XEC4HkPG6zoOEAL_xbPFuLru5BnA",
    authDomain: "era-battle.firebaseapp.com",
    databaseURL: "https://era-battle-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "era-battle",
    storageBucket: "era-battle.firebasestorage.app",
    messagingSenderId: "546262567504",
    appId: "1:546262567504:web:d9e930055b881cfa985f55",
    measurementId: "G-VN9VNYK0E9"
};
