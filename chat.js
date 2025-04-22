const CLIENT_ID = '95092625670-a95kqduv56orjov64jpbr53r22a9664p.apps.googleusercontent.com';
const CHANNEL_ID = 'UC5DNw4_nTttXpsNR3r0AeJw';
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

let accessToken = '';
let tokenClient;

// Get query param from URL
function getVideoIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

async function loadAuth() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

async function authenticate() {
  await loadAuth();

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      init();  // Proceed to chat fetching
    },
  });

  tokenClient.requestAccessToken();
}

async function fetchWithAuth(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.json();
}

async function getLiveChatIdFromVideo(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}`;
  const data = await fetchWithAuth(url);
  return data.items?.[0]?.liveStreamingDetails?.activeLiveChatId || null;
}

async function getLatestPublicLiveVideoId(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&eventType=live&type=video&order=date&maxResults=1`;
  const data = await fetchWithAuth(url);
  return data.items?.[0]?.id?.videoId || null;
}

function startChat(LIVE_CHAT_ID) {
  let nextPageToken = '';
  const seenMessages = new Set();

  async function fetchChat() {
    const url = new URL('https://www.googleapis.com/youtube/v3/liveChat/messages');
    url.searchParams.set('liveChatId', LIVE_CHAT_ID);
    url.searchParams.set('part', 'snippet,authorDetails');
    if (nextPageToken) url.searchParams.set('pageToken', nextPageToken);

    const data = await fetchWithAuth(url.toString());
    nextPageToken = data.nextPageToken;

    const chatBox = document.getElementById('chat-box');

    if (data.items) {
      data.items.forEach(msg => {
        if (seenMessages.has(msg.id)) return;
        seenMessages.add(msg.id);

        const author = msg.authorDetails.displayName;
        const text = msg.snippet.displayMessage;
        const profileImage = msg.authorDetails.profileImageUrl;

        const isModerator = msg.authorDetails.isChatModerator;
        const isOwner = msg.authorDetails.isChatOwner;

        let authorColor = '#afafaf';
        let authorStyle = '';

        if (isModerator) {
          authorColor = '#5e84f1';
        }

        if (isOwner) {
          authorColor = '#000';
          authorStyle = `background-color: #ffd600; border-radius: 6px; padding: 3px 6px;`;
        }

        const el = document.createElement('div');
        el.className = 'yt-chat-message';
        el.innerHTML = `
          <img class="yt-chat-avatar" src="${profileImage}" alt="${author}">
          <div class="yt-chat-content-inline">
            <span class="yt-chat-author" style="color: ${authorColor}; ${authorStyle}">${author}</span>
            <span class="yt-chat-text">${text}</span>
          </div>
        `;

        chatBox.appendChild(el);
        chatBox.scrollTop = chatBox.scrollHeight;
      });
    }

    setTimeout(fetchChat, 5000);
  }

  fetchChat();
}

async function init() {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = '<i>Loading chat...</i>';

  const videoIdFromUrl = getVideoIdFromURL();
  let videoId = videoIdFromUrl || await getLatestPublicLiveVideoId(CHANNEL_ID);

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

// Start authentication when page loads
authenticate();
