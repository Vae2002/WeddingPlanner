document.addEventListener("DOMContentLoaded", () => {

  if (document.referrer.endsWith('/') || document.referrer.includes('/login')) {
    sessionStorage.removeItem('bgAudioTime');
  }

  const disc = document.getElementById("audio-player");
  const audio = document.getElementById("background-audio");

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let offsetX = 0;
  let offsetY = 0;

  // Always mark that user has visited
  localStorage.setItem('hasVisited', 'true');

  // Resume from saved time if available
  const savedTime = sessionStorage.getItem('bgAudioTime');
  if (savedTime) {
    audio.currentTime = parseFloat(savedTime);
  }

  // Autoplay logic
  const audioAllowed = localStorage.getItem('audioAllowed');
  if (audioAllowed === 'true') {
    // Try autoplay immediately
    audio.play().then(() => {
      console.log("Autoplay succeeded");
    }).catch(() => {
      console.warn("Autoplay blocked. Waiting for user interaction.");

      // Wait for user interaction to resume audio (iOS fix)
      const resumeAudio = () => {
        audio.play().then(() => {
          console.log("Audio resumed after user interaction");
        }).catch(err => {
          console.log("Audio resume failed:", err);
        });
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
      };

      document.addEventListener('click', resumeAudio);
      document.addEventListener('touchstart', resumeAudio);
    });
  }

  // Click to toggle play/pause if not a drag
  disc.addEventListener("click", (e) => {
    const movedX = Math.abs(e.clientX - dragStartX);
    const movedY = Math.abs(e.clientY - dragStartY);
    const isClick = movedX < 5 && movedY < 5;

    if (isClick) {
      if (audio.paused) {
        audio.play();
        disc.classList.remove("paused");
      } else {
        audio.pause();
        disc.classList.add("paused");
      }
    }
  });

  disc.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    offsetX = e.clientX - disc.getBoundingClientRect().left;
    offsetY = e.clientY - disc.getBoundingClientRect().top;

    disc.style.left = `${disc.getBoundingClientRect().left}px`;
    disc.style.top = `${disc.getBoundingClientRect().top}px`;
    disc.style.right = "auto";
    disc.style.bottom = "auto";
    disc.style.position = "fixed";
    disc.style.cursor = "grabbing";

    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      disc.style.left = `${e.clientX - offsetX}px`;
      disc.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      disc.style.cursor = "grab";
    }
  });
});

// Save audio time on page unload
window.addEventListener('beforeunload', () => {
  const audio = document.getElementById("background-audio");
  if (audio) {
    sessionStorage.setItem('bgAudioTime', audio.currentTime);
  }
});
