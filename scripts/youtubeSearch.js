const YOUTUBE_API_KEY = "AIzaSyA_0Zh1mAph2lPYNQCiKkL3oy4boD_IQYQ";

/* ---------- CLEAN TITLE ---------- */
function cleanTitle(title) {
  return title
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/official.*$/i, "")
    .replace(/lyrics.*$/i, "")
    .replace(/audio.*$/i, "")
    .trim();
}

/* ---------- ISO 8601 → SECONDS ---------- */
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  return (parseInt(m?.[1] || 0) * 60) + parseInt(m?.[2] || 0);
}

/* ---------- FILTER CONFIG ---------- */

const BLOCKED = [
  "cover","reaction","remix","sped","slowed","nightcore","8d",
  "edit","status","shorts","reel","mashup","karaoke","instrumental",
  "live","performance","tutorial"
];

const LABEL_HINTS = [
  "vevo","records","music","entertainment",
  "t-series","sony","saregama","zee","tips",
  "aditya","yrf","eros","lahari","sun","think"
];

/* ---------- SEARCH ---------- */
export async function searchYouTube(query) {
  const searchRes = await fetch(
    "https://www.googleapis.com/youtube/v3/search?" +
    new URLSearchParams({
      part: "snippet",
      q: `${query} official audio`,
      type: "video",
      videoCategoryId: "10",
      maxResults: 8, // 🔥 reduced for quota
      key: YOUTUBE_API_KEY
    })
  );

  if (!searchRes.ok) {
    throw new Error("YouTube quota exceeded");
  }

  const searchData = await searchRes.json();
  if (!searchData.items?.length) return [];

  const ids = searchData.items.map(i => i.id.videoId).join(",");

  const detailsRes = await fetch(
    "https://www.googleapis.com/youtube/v3/videos?" +
    new URLSearchParams({
      part: "contentDetails",
      id: ids,
      key: YOUTUBE_API_KEY
    })
  );

  const details = await detailsRes.json();
  const durations = {};
  details.items.forEach(v => durations[v.id] = parseDuration(v.contentDetails.duration));

  return searchData.items
    .map(item => {
      const titleRaw = item.snippet.title.toLowerCase();
      if (BLOCKED.some(w => titleRaw.includes(w))) return null;

      const duration = durations[item.id.videoId] || 0;
      if (duration < 60 || duration > 900) return null;

      const channel = item.snippet.channelTitle.toLowerCase();
      let score = LABEL_HINTS.some(w => channel.includes(w)) ? 3 : 0;

      return {
        videoId: item.id.videoId,
        title: cleanTitle(item.snippet.title),
        artist: item.snippet.channelTitle.replace(/vevo/i, "").trim(),
        image: item.snippet.thumbnails.medium.url,
        duration,
        score
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}
