let player;
let userMood = localStorage.getItem("userMood") || "calm"; // default fallback

function onYouTubeIframeAPIReady() {
  fetch("Songs.json")
    .then((res) => res.json())
    .then((data) => {
      const moodData = data[userMood] || data["calm"]; // fallback again

      player = new YT.Player("player", {
        height: "200",
        width: "320",
        videoId: moodData.videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          mute: 1,
          start: moodData.start,
          end: moodData.end,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
          },
          onStateChange: function (event) {
            if (event.data === YT.PlayerState.PLAYING) {
              const playTime = (moodData.end - moodData.start) * 1000;
              setTimeout(() => {
                player.stopVideo();
              }, playTime);
            }
          }
        }
      });
    });
}
