window.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll(".image-carousel");

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const nextBtn = carousel.querySelector(".next");
    const prevBtn = carousel.querySelector(".prev");
    const dotsContainer = carousel.querySelector(".carousel-dots");

    let slides = Array.from(track.children);
    let currentIndex = 0;
    let isAnimating = false;

    const autoplayIntervalMs = 7000;
    let autoplayTimer;

    const updateDots = () => {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className = "dot" + (i === currentIndex ? " active" : "");
        dot.addEventListener("click", () => {
          if (isAnimating) return;
          currentIndex = i;
          animateCarousel();
          resetAutoplay();
        });
        dotsContainer.appendChild(dot);
      });
    };

    const animateCarousel = () => {
      const slideWidth = slides[0]?.offsetWidth || 0;
      if (slideWidth === 0) {
        console.warn("Slide width is zero. Skipping animation.");
        return;
      }

      isAnimating = true;
      const startX = parseFloat(track.style.transform.replace("translateX(", "").replace("px)", "")) || 0;
      const targetX = -slideWidth * currentIndex;
      const duration = 300; // ms
      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress); // easeInOut
        const newX = startX + (targetX - startX) * easedProgress;
        track.style.transform = `translateX(${newX}px)`;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          isAnimating = false;
          updateDots();
        }
      }

      requestAnimationFrame(step);
    };

    const goToNextSlide = () => {
      if (isAnimating) return;
      currentIndex = (currentIndex + 1) % slides.length;
      animateCarousel();
    };

    const goToPrevSlide = () => {
      if (isAnimating) return;
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      animateCarousel();
    };

    const resetAutoplay = () => {
      clearInterval(autoplayTimer);
      autoplayTimer = setInterval(goToNextSlide, autoplayIntervalMs);
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
        if (Math.abs(dx) > Math.abs(dy)) {
          e.preventDefault();
          hasMoved = true;
        }
      }, { passive: false });

      element.addEventListener("touchend", (e) => {
        if (!isTouching) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (hasMoved && Math.abs(dx) > 50) {
          dx > 0 ? goToPrevSlide() : goToNextSlide();
          resetAutoplay();
        }
        isTouching = false;
        hasMoved = false;
      });

      let mouseStartX = 0;
      element.addEventListener("mousedown", (e) => {
        isTouching = true;
        mouseStartX = e.clientX;

        const onMouseMove = () => {};

        const onMouseUp = (upEvent) => {
          const diff = mouseStartX - upEvent.clientX;
          if (Math.abs(diff) > 50) {
            diff > 0 ? goToNextSlide() : goToPrevSlide();
            resetAutoplay();
          }
          isTouching = false;
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    };

    const swipeArea = carousel.querySelector(".carousel-window") || carousel;
    addSwipeListeners(swipeArea);

    nextBtn?.addEventListener("click", () => {
      goToNextSlide();
      resetAutoplay();
    });

    prevBtn?.addEventListener("click", () => {
      goToPrevSlide();
      resetAutoplay();
    });

    window.addEventListener("resize", () => {
      slides = Array.from(track.children);
      animateCarousel();
    });

    animateCarousel();
    autoplayTimer = setInterval(goToNextSlide, autoplayIntervalMs);
  });

  // The rest of your code remains unchanged:

  // Days left logic
  const targetDate = new Date("2025-09-06");
  const today = new Date();
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  const message = diffDays > 0 ? `${diffDays} days left` : "The big day has arrived or passed! 🎉";
  document.getElementById("days-left-1").textContent = message;
  document.getElementById("days-left-2").textContent = message;

  document.querySelectorAll('.post-wrapper').forEach(post => {
    const likeButton = post.querySelector('.icon-button[title="Like"]');
    const carousel = post.querySelector('.image-carousel');
    if (!likeButton || !carousel) return;
    const postId = carousel.id;
    if (localStorage.getItem(`liked-${postId}`) === 'true') {
      likeButton.classList.add('liked');
    }
    likeButton.addEventListener('click', e => {
      e.preventDefault();
      likeButton.classList.toggle('liked');
      localStorage.setItem(`liked-${postId}`, likeButton.classList.contains('liked'));
    });
    carousel.addEventListener('dblclick', () => {
      likeButton.classList.toggle('liked');
      localStorage.setItem(`liked-${postId}`, likeButton.classList.contains('liked'));
    });
  });

  document.querySelectorAll('.icon-button[title="Like"]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      button.classList.toggle('liked');
    });
  });

  // COUNTDOWN TIMER
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('mins');
  const secondsEl = document.getElementById('seconds');
  const targetDate2 = new Date("2025-09-06T00:00:00");

  function updateCountdown() {
    const now = new Date();
    const diff = targetDate2 - now;
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
  const countdownInterval = setInterval(updateCountdown, 1000);
  updateCountdown();

  document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', () => {
      const valueToCopy = button.getAttribute('data-copy');
      navigator.clipboard.writeText(valueToCopy).then(() => {
        alert(`Copied: ${valueToCopy}`);
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

  let modalImageList = [];
  let currentModalIndex = 0;

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
    event.stopPropagation();
    if (modalImageList.length === 0) return;
    currentModalIndex = (currentModalIndex + 1) % modalImageList.length;
    document.getElementById("modalImage").src = modalImageList[currentModalIndex];
  }
  function prevImage(event) {
    event.stopPropagation();
    if (modalImageList.length === 0) return;
    currentModalIndex = (currentModalIndex - 1 + modalImageList.length) % modalImageList.length;
    document.getElementById("modalImage").src = modalImageList[currentModalIndex];
  }

  window.openModal = openModal;
  window.closeModal = closeModal;
  window.nextImage = nextImage;
  window.prevImage = prevImage;
  window.openQRModal = openQRModal;
  window.closeQRModal = closeQRModal; 

});

function openBarcodeModal() {
  const barcodeImage = document.getElementById("barcodeImage");
  const barcodeUsername = document.getElementById("barcodeUsername");
  const guestCount = document.getElementById("guestCount");
  const kodeAngpao = document.getElementById("kodeAngpao");

  // Set barcode image (cache bust)
  barcodeImage.src = "/barcode?" + new Date().getTime();

  // Get username from H1 greeting
  const helloText = document.querySelector("h1")?.textContent || "";
  const username = helloText.replace("Hello", "").replace("!", "").trim();
  barcodeUsername.textContent = username;

  // Fetch user info
  fetch("/get-user-info")
    .then(response => response.json())
    .then(data => {
      const count = data.n_person_confirm ?? 0;
      guestCount.textContent = `Jumlah Tamu: ${count}`;

      const kode = data.kode_angpao ?? "-";
      kodeAngpao.innerHTML = `Kode Angpao: <strong>${kode}</strong>`;
    })
    .catch(err => {
      guestCount.textContent = "Jumlah Tamu: -";
      kodeAngpao.innerHTML = `Kode Angpao: <strong>-</strong>`;
      console.error("Failed to fetch user info:", err);
    });

  document.getElementById("barcodeModal").style.display = "block";
}

function closeBarcodeModal() {
    document.getElementById("barcodeModal").style.display = "none";
}

// Attach event listener
document.getElementById("showBarcodeBtn").addEventListener("click", openBarcodeModal);

