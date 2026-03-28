
const testApi = async () => {
  const videoId = "TxFh8Xw5Dh0";
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '908e2dc936mshfe42fcefc4a4269p18a1fcjsne871a7b4335e',
      'X-RapidAPI-Host': 'youtube-video-download-info.p.rapidapi.com'
    }
  };

  try {
    const res = await fetch(`https://youtube-video-download-info.p.rapidapi.com/dl?id=${videoId}`, options);
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Keys:", Object.keys(json));
  } catch (err) {
    console.error(err);
  }
};

testApi();
