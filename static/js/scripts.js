document.addEventListener("DOMContentLoaded", () => {
  const disc = document.getElementById("audio-player");
  const audio = document.getElementById("background-audio");

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let offsetX = 0;
  let offsetY = 0;

  // First-time autoplay logic with timeout reset
    const lastVisit = localStorage.getItem('lastVisit');
    const TEN_MINUTES = 10 * 60 * 1000;
    const now = Date.now();

    if (!lastVisit || now - parseInt(lastVisit, 10) > TEN_MINUTES) {
    // Treat as first visit
    localStorage.setItem('hasVisited', 'true');
    localStorage.setItem('lastVisit', now.toString());

    audio.play().catch(() => {
        console.warn("Autoplay blocked on first visit. User interaction required.");
    });
    } else {
    // Not first visit recently, just try resuming
    localStorage.setItem('lastVisit', now.toString()); // Update visit time
    audio.play().catch(() => {});
    }

  // Resume from saved time if available
  const savedTime = localStorage.getItem('bgAudioTime');
  if (savedTime) {
    audio.currentTime = parseFloat(savedTime);
  }

    // First-time autoplay logic
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
    localStorage.setItem('hasVisited', 'true');
    audio.play().catch(() => {
        console.warn("Autoplay blocked on first visit. User interaction required.");
    });
    } else {
    audio.play().catch(() => {});
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
    localStorage.setItem('bgAudioTime', audio.currentTime);
  }
});