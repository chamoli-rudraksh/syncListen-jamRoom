🎧 SyncListen — Real-Time Collaborative Music Rooms

SyncListen is a real-time collaborative web application that allows multiple users to create shared listening rooms, search and queue music, and listen in sync with host-controlled playback.
The project focuses on real-time state synchronization, multi-user coordination, and authority control, rather than simple UI playback.

🚀 Features
🧑‍🤝‍🧑 Real-Time Rooms

Create and join rooms using a short, shareable room code

Persistent user identity per room (no duplicate members on refresh)

Live member presence with heartbeat-based activity tracking

👑 Host-Controlled Playback

First user automatically becomes the host

Only the host can:

Play / pause music

Control playback time

Remove songs from the queue

Playback state is synchronized across all connected clients

🎶 Music Search & Queue

Search music using the YouTube Data API

Advanced filtering to prioritize official music uploads and avoid covers, remixes, shorts, and edits

Add tracks to a shared queue in real time

Queue updates instantly for all members

🔄 Real-Time Synchronization

Firestore onSnapshot listeners for:

Members list

Song queue

Player state (play/pause, current track, timestamp)

Automatic playback resync for late joiners

▶️ Synchronized Audio Playback

Uses the YouTube IFrame Player API in hidden audio-only mode

Host periodically syncs playback time to Firestore

All listeners stay in sync with minimal drift

🛠️ Tech Stack

Frontend

HTML, CSS (SCSS)

Vanilla JavaScript (ES Modules)

Backend / Realtime

Firebase Firestore

Firebase Hosting

Media & APIs

YouTube Data API (search)

YouTube IFrame Player API (audio playback)

🧠 Key Engineering Concepts Demonstrated

Real-time state synchronization

Multi-user concurrency handling

Host-authority and permission control

Event debouncing and throttling

Distributed playback time reconciliation

Firestore data modeling for collaborative systems

📦 Firestore Data Model (Simplified)
rooms/
 └── {roomId}
     ├── hostId
     ├── members/
     │   └── {userId}
     │       ├── name
     │       └── lastSeen
     ├── queue/
     │   └── {songId}
     │       ├── videoId
     │       ├── title
     │       ├── artist
     │       ├── duration
     │       └── addedAt
     └── player/
         └── state
             ├── isPlaying
             ├── currentIndex
             └── currentTime

⚠️ Limitations (Intentional & Acknowledged)

Uses YouTube audio playback due to Spotify Web Playback SDK requiring Premium accounts

Playback is synchronized but not sample-accurate (acceptable for web apps)

No user authentication (anonymous sessions by design)

⭐ If you’re reviewing this project

This is not a clone — it is a systems-oriented collaborative application built from scratch to explore real-world engineering tradeoffs.

Playback is synchronized but not sample-accurate (acceptable for web apps)

No user authentication (anonymous sessions by design)
