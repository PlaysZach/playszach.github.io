async function init() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = ''; // Always clear the initial message and show the UI
  
    // Show a placeholder message immediately
    const placeholder = document.createElement('div');
    placeholder.className = 'yt-chat-message';
    placeholder.innerHTML = `<span class="yt-chat-text"><i>Waiting for live chat to become available...</i></span>`;
    chatBox.appendChild(placeholder);
  
    // Step 1: Try to get currently live stream
    const liveVideoId = await getLatestLivestreamId(CHANNEL_ID, 'live');
    let chatId = null;
  
    if (liveVideoId) {
      chatId = await getLiveChatIdFromVideo(liveVideoId);
    }
  
    // Step 2: If no live, try upcoming (scheduled)
    if (!chatId) {
      const scheduledVideoId = await getLatestLivestreamId(CHANNEL_ID, 'upcoming');
      if (scheduledVideoId) {
        chatId = await getLiveChatIdFromVideo(scheduledVideoId);
      }
    }
  
    if (chatId) {
      chatBox.innerHTML = ''; // Remove "waiting" message
      startChat(chatId);
    } else {
      console.log("No live or scheduled chat available yet.");
      // Leave placeholder message up and optionally retry later
      setTimeout(init, 15000); // Try again in 15 seconds
    }
  }
  