import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtY94Tu4Z9GBxhERJP4VWi5C-kNs_pyxs",
  authDomain: "spotify-jam-28a49.firebaseapp.com",
  projectId: "spotify-jam-28a49",
  storageBucket: "spotify-jam-28a49.firebasestorage.app",
  messagingSenderId: "404482401394",
  appId: "1:404482401394:web:d50e2a44e67412cbb00eeb"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
