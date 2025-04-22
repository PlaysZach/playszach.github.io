async function getLiveChatIdFromChannel(channelId) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&eventType=live&type=video&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
  
    if (data.items && data.items.length > 0) {
      const videoId = data.items[0].id.videoId;
      const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${API_KEY}`;
      const videoRes = await fetch(videoDetailsUrl);
      const videoData = await videoRes.json();
  
      const liveChatId = videoData.items[0]?.liveStreamingDetails?.activeLiveChatId;
      return liveChatId;
    } else {
      console.warn("No live stream currently found.");
      return null;
    }
  }
  