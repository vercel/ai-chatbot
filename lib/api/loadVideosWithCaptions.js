const axios = require("axios");

const API_URL = 'https://www.googleapis.com/youtube/v3/';
const API_TOKEN = 'AIzaSyAmDgTEghS9QZAoFwYO_J8Tmft4BbaKENE';
const caption_regex = /https:\/\/www.youtube.com\/api\/timedtext[^"]*/;
const API_WATCH = 'https://www.youtube.com/watch';

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
    const URL = `${API_WATCH}?v=${videoId}`;
    const res = await axios.get(URL);
    const captionUrl = caption_regex.exec(res.data)[0];
    const decodedCaptionDownloadUrl = JSON.parse('"' + captionUrl.replace(/"/g, '\\\\\\\\"') + '"');
    return await downloadCaptions(decodedCaptionDownloadUrl);
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