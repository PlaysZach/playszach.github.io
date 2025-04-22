const API_KEY = 'AIzaSyATsY24GhSlGiypVb-O6EpgBxi4NhDC8zo'; // Replace with your YouTube API key
const CHANNEL_ID = 'UC5DNw4_nTttXpsNR3r0AeJw'; // Replace with your YouTube channel ID

// Get the latest video (either live or scheduled)
async function getLatestStreamVideoId() {
  const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=upcoming&type=video&order=date&maxResults=1&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.id?.videoId || null;
}

// Try both live and scheduled to get the first video with activeLiveChatId
async function getFirstChatCapableVideoId() {
  const eventTypes = ['live', 'upcoming'];
  for (const type of eventTypes) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=${type}&type=video&order=date&maxResults=1&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const videoId = data.items?.[0]?.id?.videoId;
    if (videoId) {
      const chatId = await getLiveChatIdFromVideo(videoId);
      if (chatId) return chatId;
    }
  }
  return null;
}

// Get the activeLiveChatId from the video details
async function getLiveChatIdFromVideo(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.liveStreamingDetails?.activeLiveChatId || null;
}

// Start displaying chat
function startChat(LIVE_CHAT_ID) {
  let nextPageToken = '';
  const seenMessages = new Set();

  async function fetchChat() {
    const url = new URL('https://www.googleapis.com/youtube/v3/liveChat/messages');
    url.searchParams.set('liveChatId', LIVE_CHAT_ID);
    url.searchParams.set('part', 'snippet,authorDetails');
    url.searchParams.set('key', API_KEY);
    if (nextPageToken) url.searchParams.set('pageToken', nextPageToken);

    const response = await fetch(url.toString());
    const data = await response.json();

    nextPageToken = data.nextPageToken;

    const chatBox = document.getElementById('chat-box');

    if (data.items) {
      data.items.forEach(msg => {
        if (seenMessages.has(msg.id)) return;
        seenMessages.add(msg.id);

        const author = msg.authorDetails.displayName;
        const text = msg.snippet.displayMessage;
        const profileImage = msg.authorDetails.profileImageUrl;

        const el = document.createElement('div');
        el.className = 'yt-chat-message';

        el.innerHTML = `
          <img class="yt-chat-avatar" src="${profileImage}" alt="${author}">
          <div class="yt-chat-content">
            <span class="yt-chat-author">${author}</span>
            <span class="yt-chat-text">${text}</span>
          </div>
        `;

        chatBox.appendChild(el);
        chatBox.scrollTop = chatBox.scrollHeight;
      });
    }

    setTimeout(fetchChat, 3000);
  }

  fetchChat();
}

// Initialize
async function init() {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = '<i>Loading chat...</i>';

  const chatId = await getFirstChatCapableVideoId();

  if (chatId) {
    chatBox.innerHTML = '';
    startChat(chatId);
  } else {
    chatBox.innerHTML = "<i>No stream with active chat found.</i>";
  }
}

init();
