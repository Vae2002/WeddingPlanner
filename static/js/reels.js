document.getElementById('video-click-overlay').addEventListener('click', () => {
  const video = document.getElementById("background-video");
  if (video.paused) video.play();
  else video.pause();
});
