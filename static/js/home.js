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
      let isTouching = false;

      element.addEventListener("touchstart", (e) => {
        if (e.touches.length > 1) return;
        isTouching = true;
        touchStartX = e.touches[0].clientX;
      });

      element.addEventListener("touchend", (e) => {
        if (!isTouching || e.changedTouches.length === 0) return;
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? goToNextSlide() : goToPrevSlide();
        }
        isTouching = false;
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

    addSwipeListeners(carousel);
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
