const axios = require("axios");

const API_URL = 'https://www.googleapis.com/youtube/v3/';
const API_TOKEN = 'AIzaSyAmDgTEghS9QZAoFwYO_J8Tmft4BbaKENE';
const caption_regex = /https:\/\/www.youtube.com\/api\/timedtext[^"]*/;

async function loadVideosWithCaptions(searchKey) {
  try {
    const url = `${API_URL}search?key=${API_TOKEN}&type=video&part=snippet&videoCaption=any&maxResults=1&q=${searchKey}`;
    const response = await axios.get(url);
    const videoIds = [...new Set(response.data.items.map((item) => item.id.videoId))];
    const videosWithCaptions = [];

    await Promise.all(videoIds.map(async (videoId) => {
      const captions = await getCaptions(videoId);
      const encodedCaptions = Buffer.from(captions, 'utf8').toString('base64'); // Encode captions to reduce size
      videosWithCaptions.push({ videoId, captions: encodedCaptions });
    }));

    return videosWithCaptions;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getCaptions(videoId) {
  try {
    const captionUrl = await getCaptionUrl(videoId);
    if (!captionUrl) {
      return null;
    }
    const captions = await downloadCaptions(captionUrl);
    return captions;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getCaptionUrl(videoId) {
  try {
    const url = `${API_URL}videos?key=${API_TOKEN}&part=player&id=${videoId}`;
    const response = await axios.get(url);
    if (response.data.items.length > 0 && response.data.items[0].player.embedHtml.match(caption_regex)) {
      const captionUrl = caption_regex.exec(response.data.items[0].player.embedHtml)[0];
      return captionUrl;
    }
    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function downloadCaptions(url) {
  try {
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = { loadVideosWithCaptions };