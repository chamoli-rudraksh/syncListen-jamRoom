import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const createBtn = document.querySelector(".btn-primary");
const joinBtn = document.querySelector(".btn-secondary");

const overlay = document.querySelector(".overlay");
const modal = document.querySelector(".join-modal");
const closeBtn = modal.querySelector(".close");
const submitBtn = modal.querySelector(".submit");
const input = modal.querySelector("input");

/* ---------- HELPERS ---------- */
function generateRoomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/* ---------- CREATE ROOM ---------- */
createBtn.addEventListener("click", async () => {
  const roomId = generateRoomId();

  await setDoc(doc(db, "rooms", roomId), {
    createdAt: Date.now()
  });

  window.location.href = `room.html?roomId=${roomId}`;
});

/* ---------- MODAL UI (NO FIREBASE HERE) ---------- */
function openModal() {
  overlay.classList.add('active');
  modal.classList.add('active');
  setTimeout(() => input.focus(), 300);
}

function closeModal() {
  overlay.classList.remove('active');
  modal.classList.remove('active');
  input.value = '';
}

joinBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

/* ---------- JOIN ROOM (ONLY HERE WE TOUCH FIREBASE) ---------- */
async function handleJoin() {
  const roomId = input.value.trim().toUpperCase();
  if (!roomId) return;

  const roomRef = doc(db, "rooms", roomId);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    alert("Room does not exist");
    return;
  }

  window.location.href = `room.html?roomId=${roomId}`;
}

submitBtn.addEventListener("click", handleJoin);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") handleJoin();
});
