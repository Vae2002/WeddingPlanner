document.addEventListener("DOMContentLoaded", () => {

  if (document.referrer.endsWith('/') || document.referrer.includes('/login')) {
    localStorage.removeItem('bgAudioTime');
  }

  const disc = document.getElementById("audio-player");
  const audio = document.getElementById("background-audio");

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let offsetX = 0;
  let offsetY = 0;

  localStorage.setItem('hasVisited', 'true');

  // Load saved time AFTER metadata is ready
  const savedTime = localStorage.getItem('bgAudioTime');
  audio.addEventListener('loadedmetadata', () => {
    if (savedTime) {
      audio.currentTime = parseFloat(savedTime);
      console.log("Resumed audio at", audio.currentTime);
    }
  });

  // iOS detection
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };

  const audioAllowed = localStorage.getItem('audioAllowed');
  if (audioAllowed === 'true') {
    if (isIOS()) {
      console.warn("iOS detected - waiting for user interaction");
      const resumeAudio = () => {
        audio.play().then(() => {
          console.log("Audio resumed after user interaction on iOS");
        }).catch(err => {
          console.log("Audio resume failed:", err);
        });
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
      };
      document.addEventListener('click', resumeAudio);
      document.addEventListener('touchstart', resumeAudio);
    } else {
      audio.play().then(() => {
        console.log("Autoplay succeeded on non-iOS");
      }).catch(err => {
        console.warn("Autoplay failed:", err);
      });
    }
  }

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

// Use 'pagehide' instead of 'beforeunload'
window.addEventListener('pagehide', () => {
  const audio = document.getElementById("background-audio");
  if (audio) {
    localStorage.setItem('bgAudioTime', audio.currentTime);
  }
});
