window.addEventListener("DOMContentLoaded", () => {
const carousels = document.querySelectorAll('.image-carousel');

    carousels.forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        const slides = track.querySelectorAll('video'); // or '.slide' if using divs/images
        let currentIndex = 0;

        let startX = 0;
        let isDragging = false;

        // TOUCH SUPPORT
        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            hasSwiped = false; // Reset swipe state
        });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const moveX = e.touches[0].clientX;
            handleSwipe(moveX);
        });

        track.addEventListener('touchend', () => {
            isDragging = false;
            startX = 0; // Reset startX after touch end
            hasSwiped = false; // Reset swipe state
        });

        // MOUSE SUPPORT
        track.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            isDragging = true;
            hasSwiped = false; // Reset swipe state
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDragging || hasSwiped) return;
            const moveX = e.clientX;
            handleSwipe(moveX);
        });

        track.addEventListener('mouseup', () => {
            isDragging = false;
            startX = 0; // Reset startX after mouse up
            hasSwiped = false; // Reset swipe state
        });

        track.addEventListener('mouseleave', () => {
            isDragging = false;
            startX = 0; // Reset startX on mouse leave
            hasSwiped = false; // Reset swipe state
        });

        function handleSwipe(currentX) {
          const diff = startX - currentX;

          if (Math.abs(diff) > 50) {
              if (diff > 0 && currentIndex < slides.length - 1) {
                currentIndex++;
              } else if (diff < 0 && currentIndex > 0) {
                currentIndex--;
              }
              updateSlide();
              hasSwiped = true; // Prevent additional swipes during the same drag
            }
      }

        function updateSlide() {
    const slideWidth = slides[0].offsetWidth;
    const offset = -currentIndex * slideWidth;
    track.style.transform = `translateX(${offset}px)`;

    // Update dots
    const dotsContainer = carousel.querySelector('.carousel-dots');
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'dot' + (i === currentIndex ? ' active' : '');
            dot.addEventListener('click', () => {
                currentIndex = i;
                updateSlide();
            });
            dotsContainer.appendChild(dot);
        });
    }
}


        // Optional: Hook up buttons
        carousel.querySelector('.next')?.addEventListener('click', () => {
            if (currentIndex < slides.length - 1) {
                currentIndex++;
                updateSlide();
            }
        });

        carousel.querySelector('.prev')?.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateSlide();
            }
        });
    });
});

document.querySelectorAll('.image-carousel').forEach((carousel, index) => {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextBtn = carousel.querySelector('.next');
    const prevBtn = carousel.querySelector('.prev');
    const dotsContainer = carousel.querySelector('.carousel-dots');

    if (!slides.length) return;

    let currentIndex = 0;
    const slideWidth = slides[0].offsetWidth;

    function updateCarousel() {
        track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'dot' + (i === currentIndex ? ' active' : '');
            dot.addEventListener('click', () => {
                currentIndex = i;
                updateCarousel();
            });
            dotsContainer.appendChild(dot);
        });
    }

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
    });

    window.addEventListener('resize', () => {
        updateCarousel(); // in case width changes
    });

    updateCarousel(); // initialize

  function initCarousel(carouselId, dotsId) {
      const carousel = document.getElementById(carouselId);
      const track = carousel.querySelector('.carousel-track');
      const slides = Array.from(track.children);
      const dotsContainer = document.getElementById(dotsId);
      let currentIndex = 0;

      function update() {
          const slideWidth = slides[0].offsetWidth;
          track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
          dotsContainer.innerHTML = '';
          slides.forEach((_, i) => {
              const dot = document.createElement('button'); // Consistent element
              dot.className = 'dot' + (i === currentIndex ? ' active' : '');
              dot.addEventListener('click', () => {
                  currentIndex = i;
                  update();
              });
              dotsContainer.appendChild(dot);
          });
      }

      carousel.dataset.currentIndex = currentIndex;
      window.addEventListener('resize', update);
      update();
  }

  function prevSlide(carouselId) {
      const carousel = document.getElementById(carouselId);
      const track = carousel.querySelector('.carousel-track');
      const slides = Array.from(track.children);
      let currentIndex = parseInt(carousel.dataset.currentIndex);
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      carousel.dataset.currentIndex = currentIndex;
      track.style.transform = `translateX(-${slides[0].offsetWidth * currentIndex}px)`;
      initCarousel(carouselId, carouselId.replace('carousel', 'dots'));
  }

  function nextSlide(carouselId) {
      const carousel = document.getElementById(carouselId);
      const track = carousel.querySelector('.carousel-track');
      const slides = Array.from(track.children);
      let currentIndex = parseInt(carousel.dataset.currentIndex);
      currentIndex = (currentIndex + 1) % slides.length;
      carousel.dataset.currentIndex = currentIndex;
      track.style.transform = `translateX(-${slides[0].offsetWidth * currentIndex}px)`;
      initCarousel(carouselId, carouselId.replace('carousel', 'dots'));
  }

  // Initialize each manually
  window.addEventListener("DOMContentLoaded", () => {
      initCarousel('carousel-1', 'dots-1');
      initCarousel('carousel-2', 'dots-2');

      // Days left section
      const targetDate = new Date('2025-09-06');
      const today = new Date();
      targetDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const message = diffDays > 0 ? `${diffDays} days left` : `The big day has arrived or passed! 🎉`;
      document.getElementById('days-left-1').textContent = message;
      document.getElementById('days-left-2').textContent = message;

    
  });
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
