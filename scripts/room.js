import { searchYouTube } from "./youtubeSearch.js";
import { db } from "./firebase.js";
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, addDoc, onSnapshot,
  updateDoc, query, orderBy,
  serverTimestamp, getDocs, writeBatch
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ================= DOM ================= */
const membersList = document.getElementById("membersList");
const queueList = document.getElementById("queueList");
const songGrid = document.getElementById("songGrid");
const searchInput = document.getElementById("searchInput");
const resultsTitle = document.getElementById("resultsTitle");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const playerImage = document.getElementById("playerImage");
const playerTitle = document.getElementById("playerTitle");
const playerArtist = document.getElementById("playerArtist");
const nowPlayingImg = document.getElementById("nowPlayingImg");
const nowPlayingTitle = document.getElementById("nowPlayingTitle");
const nowPlayingArtist = document.getElementById("nowPlayingArtist");

/* ================= YOUTUBE PLAYER ================= */
let ytPlayer = null;
let currentVideoDuration = 0;

window.onYouTubeIframeAPIReady = () => {
  ytPlayer = new YT.Player("yt-player", {
    height: "0",
    width: "0",
    playerVars: { controls: 0, rel: 0, modestbranding: 1 },
    events: {
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED && isHost) playNext();
      }
    }
  });
};

/* ================= ROOM ================= */
const roomId = new URLSearchParams(location.search).get("roomId");
if (!roomId) location.href = "index.html";

const roomRef = doc(db, "rooms", roomId);
const roomSnap = await getDoc(roomRef);
if (!roomSnap.exists()) location.href = "index.html";

let roomData = roomSnap.data();

/* ================= USER ================= */
let userId = sessionStorage.getItem(`uid-${roomId}`);
let username = sessionStorage.getItem(`name-${roomId}`);

if (!userId) {
  userId = crypto.randomUUID();
  username = prompt("Enter your name") || `Guest-${userId.slice(0,4)}`;
  sessionStorage.setItem(`uid-${roomId}`, userId);
  sessionStorage.setItem(`name-${roomId}`, username);
}

/* ================= HOST LOGIC ================= */
if (!roomData.hostId) {
  await updateDoc(roomRef, { hostId: userId });
  roomData.hostId = userId;
}

const isHost = roomData.hostId === userId;

/* ================= MEMBERS ================= */
const memberRef = doc(db, "rooms", roomId, "members", userId);
await setDoc(memberRef, {
  name: username,
  lastSeen: serverTimestamp()
}, { merge: true });

const heartbeat = setInterval(() => {
  updateDoc(memberRef, { lastSeen: serverTimestamp() }).catch(()=>{});
}, 30000);

onSnapshot(collection(db, "rooms", roomId, "members"), snap => {
  membersList.innerHTML = "";
  snap.forEach(d => {
    const li = document.createElement("li");
    li.textContent = d.data().name + (d.id === roomData.hostId ? " (Host)" : "");
    membersList.appendChild(li);
  });
});

/* ================= QUEUE ================= */
let currentQueue = [];
let currentIndex = 0;

const queueRef = collection(db, "rooms", roomId, "queue");

onSnapshot(query(queueRef, orderBy("addedAt")), snap => {
  currentQueue = [];
  queueList.innerHTML = "";

  snap.forEach(d => {
    const song = { id: d.id, ...d.data() };
    currentQueue.push(song);

    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div class="queue-item-info">
        <div class="queue-item-title">${song.title}</div>
        <div class="queue-item-artist">${song.channelTitle || ""}</div>
      </div>
      ${isHost ? `<button class="remove-btn">×</button>` : ""}
    `;

    if (isHost) {
      li.querySelector(".remove-btn").onclick = () =>
        deleteDoc(doc(db, "rooms", roomId, "queue", song.id));
    }

    queueList.appendChild(li);
  });
});

/* ================= PLAYER STATE ================= */
const playerRef = doc(db, "rooms", roomId, "player", "state");

if (!(await getDoc(playerRef)).exists()) {
  await setDoc(playerRef, {
    isPlaying: false,
    currentIndex: 0,
    currentTime: 0
  });
}

onSnapshot(playerRef, snap => {
  if (!snap.exists() || !ytPlayer || !currentQueue.length) return;

  const { isPlaying, currentIndex: idx, currentTime } = snap.data();
  currentIndex = idx;

  const song = currentQueue[idx];
  if (!song) return;

  updateUI(song);

  if (ytPlayer.getVideoData()?.video_id !== song.videoId) {
    ytPlayer.loadVideoById(song.videoId, currentTime || 0);
    setTimeout(() => {
      currentVideoDuration = ytPlayer.getDuration() || 0;
      totalTimeEl.textContent = format(currentVideoDuration);
    }, 800);
  }

  isPlaying ? ytPlayer.playVideo() : ytPlayer.pauseVideo();
});

/* ================= CONTROLS ================= */
playBtn.onclick = async () => {
  if (!isHost) return alert("Only host controls playback");
  const snap = await getDoc(playerRef);
  await updateDoc(playerRef, { isPlaying: !snap.data().isPlaying });
};

prevBtn.onclick = async () => {
  if (!isHost || !currentQueue.length) return;
  const idx = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
  await updateDoc(playerRef, { currentIndex: idx, currentTime: 0, isPlaying: true });
};

nextBtn.onclick = () => isHost && playNext();

async function playNext() {
  if (!currentQueue.length) return;
  const idx = (currentIndex + 1) % currentQueue.length;
  await updateDoc(playerRef, { currentIndex: idx, currentTime: 0, isPlaying: true });
}

/* ================= TIME SYNC (HOST ONLY) ================= */
setInterval(() => {
  if (!isHost || !ytPlayer || ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) return;
  updateDoc(playerRef, { currentTime: ytPlayer.getCurrentTime() }).catch(()=>{});
  updateProgress();
}, 1000);

/* ================= PROGRESS ================= */
progressBar.onclick = e => {
  if (!isHost || !currentVideoDuration) return;
  const p = (e.offsetX / progressBar.clientWidth) * currentVideoDuration;
  ytPlayer.seekTo(p, true);
  updateDoc(playerRef, { currentTime: p });
};

function updateProgress() {
  const t = ytPlayer.getCurrentTime();
  progressFill.style.width = `${(t / currentVideoDuration) * 100}%`;
  currentTimeEl.textContent = format(t);
}

function format(s) {
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
}

/* ================= SEARCH ================= */
let timer;
searchInput.oninput = e => {
  clearTimeout(timer);
  const q = e.target.value.trim();
  timer = setTimeout(async () => {
    const songs = await searchYouTube(q);
    resultsTitle.textContent = `Results for "${q}"`;
    renderSongs(songs);
  }, 600);
};

function renderSongs(songs) {
  songGrid.innerHTML = "";
  songs.forEach(song => {
    const d = document.createElement("div");
    d.className = "song";
    d.innerHTML = `
      <img src="${song.image}">
      <div class="song-title">${song.title}</div>
      <button class="add-btn">+</button>
    `;
    d.querySelector(".add-btn").onclick = () =>
      addDoc(queueRef, { ...song, addedAt: serverTimestamp() });
    songGrid.appendChild(d);
  });
}

/* ================= UI ================= */
function updateUI(song) {
  playerImage.src = song.image;
  playerTitle.textContent = song.title;
  playerArtist.textContent = song.channelTitle || "";
  nowPlayingImg.src = song.image;
  nowPlayingTitle.textContent = song.title;
  nowPlayingArtist.textContent = song.channelTitle || "";
}

/* ================= LEAVE ================= */
disconnectBtn.onclick = async () => {
  clearInterval(heartbeat);
  await deleteDoc(memberRef);
  sessionStorage.clear();
  location.href = "index.html";
};
