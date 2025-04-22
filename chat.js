const API_KEY = 'AIzaSyATsY24GhSlGiypVb-O6EpgBxi4NhDC8zo';
const CHANNEL_ID = 'UC5DNw4_nTttXpsNR3r0AeJw';  // Replace with YouTube channel's ID

// Function to get the latest live stream or upcoming stream
async function getLatestLivestreamId(channelId, eventType) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&eventType=${eventType}&type=video&order=date&maxResults=1&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.items?.[0]?.id?.videoId || null;
}

// Function to get the live chat ID from the video
async function getLiveChatIdFromVideo(videoId) {
  const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${API_KEY}`;
  const res = await fetch(videoDetailsUrl);
  const data = await res.json();
  
  // Check if live streaming details exist
  if (data.items && data.items[0].liveStreamingDetails) {
    return data.items[0].liveStreamingDetails.activeLiveChatId || null;
  }
  return null;
}

// Function to start fetching chat messages
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

    setTimeout(fetchChat, 3000); // Continue fetching every 3 seconds
  }

  fetchChat();
}

// Initialize the chat fetching process
async function init() {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = '<i>Loading chat...</i>'; // Show loading message

  // Step 1: Try to get the live stream first
  const liveVideoId = await getLatestLivestreamId(CHANNEL_ID, 'live');
  let chatId = null;

  if (liveVideoId) {
    chatId = await getLiveChatIdFromVideo(liveVideoId);
  }

  // Step 2: If no live stream, get the upcoming scheduled stream
  if (!chatId) {
    const scheduledVideoId = await getLatestLivestreamId(CHANNEL_ID, 'upcoming');
    if (scheduledVideoId) {
      // Here, even if the stream is not live yet, we still attempt to get the chat ID
      chatId = await getLiveChatIdFromVideo(scheduledVideoId);
    }
  }

  // If chat ID is found, start the chat
  if (chatId) {
    chatBox.innerHTML = ''; // Clear loading message
    startChat(chatId);
  } else {
    chatBox.innerHTML = "<i>No live or scheduled chat available at this time.</i>";
  }
}

// Run the initialization when the page loads
init();
