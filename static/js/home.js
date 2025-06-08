window.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll(".image-carousel");

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const slides = Array.from(track.children);
    const nextBtn = carousel.querySelector(".next");
    const prevBtn = carousel.querySelector(".prev");
    const dotsContainer = carousel.querySelector(".carousel-dots");

    let currentIndex = 0;
    let startX = 0;
    let isDragging = false;
    let hasSwiped = false;

    const updateCarousel = () => {
      const slideWidth = slides[0].offsetWidth;
      track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;

      if (dotsContainer) {
        dotsContainer.innerHTML = "";
        slides.forEach((_, i) => {
          const dot = document.createElement("button");
          dot.className = "dot" + (i === currentIndex ? " active" : "");
          dot.addEventListener("click", () => {
            currentIndex = i;
            updateCarousel();
          });
          dotsContainer.appendChild(dot);
        });
      }

      carousel.dataset.currentIndex = currentIndex;
    };

    const goToNextSlide = () => {
      if (currentIndex < slides.length - 1) currentIndex++;
      updateCarousel();
    };

    const goToPrevSlide = () => {
      if (currentIndex > 0) currentIndex--;
      updateCarousel();
    };

    // Touch + Mouse swipe support
    const handleSwipe = (currentX) => {
      const diff = startX - currentX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goToNextSlide();
        else goToPrevSlide();
        hasSwiped = true;
      }
    };

    const addSwipeListeners = (element) => {
      let endX = 0;

  element.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  element.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    endX = e.touches[0].clientX;
  });

  element.addEventListener("touchend", () => {
    if (!isDragging) return;

    const diff = startX - endX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNextSlide();
      else goToPrevSlide();
    }

    isDragging = false;
    startX = 0;
    endX = 0;
      });

      element.addEventListener("mousedown", (e) => {
        startX = e.clientX;
        isDragging = true;
        hasSwiped = false;
      });

      element.addEventListener("mousemove", (e) => {
        if (!isDragging || hasSwiped) return;
        handleSwipe(e.clientX);
      });

      element.addEventListener("mouseup", () => {
        isDragging = false;
        startX = 0;
        hasSwiped = false;
      });

      element.addEventListener("mouseleave", () => {
        isDragging = false;
        startX = 0;
        hasSwiped = false;
      });
    };

    addSwipeListeners(track);

    nextBtn?.addEventListener("click", goToNextSlide);
    prevBtn?.addEventListener("click", goToPrevSlide);
    window.addEventListener("resize", updateCarousel);

    updateCarousel(); // init
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
