window.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll(".image-carousel");

  carousels.forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    let slides = Array.from(track.children);
    const nextBtn = carousel.querySelector(".next");
    const prevBtn = carousel.querySelector(".prev");
    const dotsContainer = carousel.querySelector(".carousel-dots");

    let currentIndex = 0;

    const updateCarousel = () => {
      slides = Array.from(track.children); // Re-fetch slides
      const slideWidth = slides[0].offsetWidth;
      track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
      track.style.transition = 'transform 0.3s ease-in-out';

      // Update dots
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
      if (currentIndex < slides.length - 1) {
        currentIndex++;
        updateCarousel();
      }
    };

    const goToPrevSlide = () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    };

    const addSwipeListeners = (element) => {
      let touchStartX = 0;
      let touchCurrentX = 0;
      let isTouching = false;

      element.addEventListener("touchstart", (e) => {
         if (e.touches.length > 1) return; // ignore multi-touch
          isTouching = true;
          touchStartX = e.touches[0].clientX;
      });

      element.addEventListener("touchmove", (e) => {
        if (!isTouching) return;
        touchCurrentX = e.touches[0].clientX;
      });

      element.addEventListener("touchend", (e) => {
        if (!isTouching) return;
          isTouching = false;
          // Fallback to touchend X if touchmove never ran
        if (touchCurrentX === 0) {
          touchCurrentX = e.changedTouches[0].clientX;
        }

        const diff = touchStartX - touchCurrentX;

        if (Math.abs(diff) > 50) {
          if (diff > 0) goToNextSlide();
        else goToPrevSlide();
        }

        // Reset
        touchStartX = 0;
        touchCurrentX = 0;
      });

      let mouseStartX = 0;
      let mouseCurrentX = 0;
      let isMouseDragging = false;

      element.addEventListener("mousedown", (e) => {
        isMouseDragging = true;
        mouseStartX = e.clientX;

    // Start tracking mouse move
    const onMouseMove = (moveEvent) => {
      if (!isMouseDragging) return;
      mouseCurrentX = moveEvent.clientX;
    };

    const onMouseUp = () => {
      isMouseDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      const diff = mouseStartX - mouseCurrentX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goToNextSlide();
        else goToPrevSlide();
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
};

    addSwipeListeners(track);
    nextBtn?.addEventListener("click", goToNextSlide);
    prevBtn?.addEventListener("click", goToPrevSlide);
    window.addEventListener("resize", updateCarousel);
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
