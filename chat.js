const API_KEY = 'AIzaSyATsY24GhSlGiypVb-O6EpgBxi4NhDC8zo';
const CHANNEL_ID = 'UC5DNw4_nTttXpsNR3r0AeJw';

// Get query param from URL
function getVideoIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

// Get the active live chat ID from a specific video
async function getLiveChatIdFromVideo(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.liveStreamingDetails?.activeLiveChatId || null;
}

// Search for latest public live stream
async function getLatestPublicLiveVideoId(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&eventType=live&type=video&order=date&maxResults=1&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.id?.videoId || null;
}

// Start pulling chat
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

  const videoIdFromUrl = getVideoIdFromURL();
  let videoId = videoIdFromUrl;

  // If no ID passed in the URL, try to get the latest public live video
  if (!videoId) {
    videoId = await getLatestPublicLiveVideoId(CHANNEL_ID);
  }

  if (!videoId) {
    chatBox.innerHTML = '<i>No live video found.</i>';
    return;
  }

  const chatId = await getLiveChatIdFromVideo(videoId);

  if (chatId) {
    chatBox.innerHTML = '';
    startChat(chatId);
  } else {
    chatBox.innerHTML = '<i>No live chat available for this video.</i>';
  }
}

init();
