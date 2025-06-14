window.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll(".image-carousel");

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const nextBtn = carousel.querySelector(".next");
    const prevBtn = carousel.querySelector(".prev");
    const dotsContainer = carousel.querySelector(".carousel-dots");

    let slides = Array.from(track.children);
    let currentIndex = 0;
    let isTransitioning = false;

    const updateDots = () => {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "dot" + (i === currentIndex ? " active" : "");
        dot.addEventListener("click", () => {
          if (isTransitioning) return;
          currentIndex = i;
          updateCarousel();
        });
        dotsContainer.appendChild(dot);
      });
    };

    const updateCarousel = () => {
      const slideWidth = slides[0]?.offsetWidth || 0;
      if (slideWidth === 0) {
        console.warn("Slide width is zero. Skipping carousel update.");
        return;
      }

      isTransitioning = true;
      track.style.transition = 'transform 0.3s ease-in-out';
      track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;

      track.addEventListener('transitionend', () => {
        isTransitioning = false;
      }, { once: true });

      updateDots();
      carousel.dataset.currentIndex = currentIndex;
    };

    const goToNextSlide = () => {
      if (isTransitioning) return;
      if (currentIndex < slides.length - 1) {
        currentIndex++;
        updateCarousel();
      }
    };

    const goToPrevSlide = () => {
      if (isTransitioning) return;
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    };

 const addSwipeListeners = (element) => {
  let touchStartX = 0;
  let touchStartY = 0;
  let isTouching = false;
  let hasMoved = false;

  element.addEventListener("touchstart", (e) => {
    if (e.touches.length > 1) return;
    isTouching = true;
    hasMoved = false;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: false });

  element.addEventListener("touchmove", (e) => {
    if (!isTouching || e.touches.length > 1) return;

    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    // If horizontal movement is dominant, prevent vertical scroll
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();  // 👈 disables vertical scroll
      hasMoved = true;
    }
  }, { passive: false });

  element.addEventListener("touchend", (e) => {
    if (!isTouching) return;

    const dx = e.changedTouches[0].clientX - touchStartX;

    if (hasMoved && Math.abs(dx) > 50) {
      dx > 0 ? goToPrevSlide() : goToNextSlide();
    }

    isTouching = false;
    hasMoved = false;
  });

      let mouseStartX = 0;
      let isMouseDragging = false;

      element.addEventListener("mousedown", (e) => {
        isMouseDragging = true;
        mouseStartX = e.clientX;

        const onMouseMove = () => {};

        const onMouseUp = (upEvent) => {
          const diff = mouseStartX - upEvent.clientX;
          if (Math.abs(diff) > 50) {
            diff > 0 ? goToNextSlide() : goToPrevSlide();
          }
          isMouseDragging = false;
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    };

    const swipeArea = carousel.querySelector(".carousel-window") || carousel;
    addSwipeListeners(swipeArea);
    nextBtn?.addEventListener("click", goToNextSlide);
    prevBtn?.addEventListener("click", goToPrevSlide);

    window.addEventListener("resize", () => {
      slides = Array.from(track.children);
      updateCarousel();
    });

    // Initial setup
    updateCarousel();
  });

  // Days left logic
  const targetDate = new Date("2025-09-06");
  const today = new Date();
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  const message =
    diffDays > 0
      ? `${diffDays} days left`
      : "The big day has arrived or passed! 🎉";

  document.getElementById("days-left-1").textContent = message;
  document.getElementById("days-left-2").textContent = message;
});


document.querySelectorAll('.post-wrapper').forEach(post => {
  const likeButton = post.querySelector('.icon-button[title="Like"]');
  const carousel = post.querySelector('.image-carousel');
  if (!likeButton || !carousel) return;

  const postId = carousel.id;  // e.g. 'carousel-1'

  // Restore liked state from localStorage
  if (localStorage.getItem(`liked-${postId}`) === 'true') {
    likeButton.classList.add('liked');
  }

  likeButton.addEventListener('click', e => {
    e.preventDefault();
    likeButton.classList.toggle('liked');
    // Save current like state
    localStorage.setItem(`liked-${postId}`, likeButton.classList.contains('liked'));
  });

  // Also update like state on double click on carousel
  carousel.addEventListener('dblclick', () => {
    likeButton.classList.toggle('liked');
    localStorage.setItem(`liked-${postId}`, likeButton.classList.contains('liked'));
  });
});


document.querySelectorAll('.icon-button[title="Like"]').forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault(); // prevent page jump if href="#"
    button.classList.toggle('liked');
  });
});

// COUNTDOWN TIMER
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('mins');
const secondsEl = document.getElementById('seconds');

const targetDate = new Date("2025-09-06T00:00:00");

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    clearInterval(countdownInterval);
    document.getElementById("countdown").innerHTML = "The big day has arrived or passed! 🎉";
    return;
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  daysEl.textContent = days.toString().padStart(2, '0');
  hoursEl.textContent = hours.toString().padStart(2, '0');
  minutesEl.textContent = minutes.toString().padStart(2, '0');
  secondsEl.textContent = seconds.toString().padStart(2, '0');
}

// Update every second
const countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown(); // Initial call

 document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', () => {
      const valueToCopy = button.getAttribute('data-copy');

      navigator.clipboard.writeText(valueToCopy).then(() => {
    // ✅ Alert user
      alert(`Copied: ${valueToCopy}`);

      // Optional visual feedback with icon
      button.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
      setTimeout(() => {
        button.innerHTML = '<ion-icon name="copy-outline"></ion-icon>';
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy. Please try again.');
    });
  });
});

  function openQRModal() {
    document.getElementById('qrModal').style.display = 'block';
  }

  function closeQRModal() {
    document.getElementById('qrModal').style.display = 'none';
  }

  let modalImageList = []; // List of image sources
let currentModalIndex = 0;

// Open modal and set image
function openModal(src) {
  const modal = document.getElementById("imgModal");
  const modalImg = document.getElementById("modalImage");

  modalImageList = Array.from(document.querySelectorAll('.photo-grid img')).map(img => img.src);
  currentModalIndex = modalImageList.indexOf(src);

  if (currentModalIndex === -1) currentModalIndex = 0;

  modal.style.display = "block";
  modalImg.src = modalImageList[currentModalIndex];
}

function closeModal() {
  document.getElementById("imgModal").style.display = "none";
}

function nextImage(event) {
  event.stopPropagation(); // prevent modal from closing
  if (modalImageList.length === 0) return;
  currentModalIndex = (currentModalIndex + 1) % modalImageList.length;
  document.getElementById("modalImage").src = modalImageList[currentModalIndex];
}

function prevImage(event) {
  event.stopPropagation(); // prevent modal from closing
  if (modalImageList.length === 0) return;
  currentModalIndex = (currentModalIndex - 1 + modalImageList.length) % modalImageList.length;
  document.getElementById("modalImage").src = modalImageList[currentModalIndex];
}
